import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const emptyForm = {
    scheduledDate: '',
    scheduledTime: '',
    duration: 30,
    interviewType: 'Video Call',
    meetingLink: '',
    location: '',
    notes: ''
};

const InterviewScheduler = () => {
    const [applications, setApplications] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', text: '' });

    // Which application the schedule form is currently open for
    const [schedulingFor, setSchedulingFor] = useState(null);
    const [rescheduling, setRescheduling] = useState(null); // interview being rescheduled
    const [formData, setFormData] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    // Which application's profile panel is currently expanded, and its data
    const [expandedProfileFor, setExpandedProfileFor] = useState(null);
    const [profileData, setProfileData] = useState({}); // studentId -> { profile, projects }
    const [profileLoading, setProfileLoading] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [appsRes, interviewsRes] = await Promise.allSettled([
                API.get('/portal/applications/company'),
                API.get('/interviews/company')
            ]);

            if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data || []);
            if (interviewsRes.status === 'fulfilled') setInterviews(interviewsRes.value.data || []);
        } catch (err) {
            console.error('Error loading interview scheduler data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Map applicationId -> most recent interview for it, for quick lookup
    const interviewByApplication = interviews.reduce((acc, interview) => {
        const appId = interview.application;
        if (!acc[appId] || new Date(interview.createdAt) > new Date(acc[appId].createdAt)) {
            acc[appId] = interview;
        }
        return acc;
    }, {});

    const toggleProfile = async (application) => {
        const studentId = application.student?._id;
        if (!studentId) return;

        if (expandedProfileFor === application._id) {
            setExpandedProfileFor(null);
            return;
        }

        setExpandedProfileFor(application._id);

        if (!profileData[studentId]) {
            setProfileLoading(studentId);
            try {
                const res = await API.get(`/portal/applicant-profile/${studentId}`);
                setProfileData((prev) => ({ ...prev, [studentId]: res.data }));
            } catch (err) {
                setProfileData((prev) => ({ ...prev, [studentId]: { error: err.response?.data?.message || 'Could not load profile.' } }));
            } finally {
                setProfileLoading(null);
            }
        }
    };

    const openScheduleForm = (applicationId) => {
        setSchedulingFor(applicationId);
        setRescheduling(null);
        setFormData(emptyForm);
        setFeedback({ type: '', text: '' });
    };

    const openRescheduleForm = (interview) => {
        const d = new Date(interview.scheduledAt);
        setRescheduling(interview);
        setSchedulingFor(null);
        setFormData({
            scheduledDate: d.toISOString().split('T')[0],
            scheduledTime: d.toTimeString().slice(0, 5),
            duration: interview.duration || 30,
            interviewType: interview.interviewType || 'Video Call',
            meetingLink: interview.meetingLink || '',
            location: interview.location || '',
            notes: interview.notes || ''
        });
        setFeedback({ type: '', text: '' });
    };

    const closeForm = () => {
        setSchedulingFor(null);
        setRescheduling(null);
        setFormData(emptyForm);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const buildScheduledAt = () => {
        if (!formData.scheduledDate || !formData.scheduledTime) return null;
        return new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const scheduledAt = buildScheduledAt();
        if (!scheduledAt) {
            setFeedback({ type: 'error', text: 'Please pick both a date and a time.' });
            return;
        }

        setSubmitting(true);
        setFeedback({ type: '', text: '' });

        const payload = {
            scheduledAt: scheduledAt.toISOString(),
            duration: parseInt(formData.duration, 10) || 30,
            interviewType: formData.interviewType,
            meetingLink: formData.meetingLink,
            location: formData.location,
            notes: formData.notes
        };

        try {
            if (rescheduling) {
                await API.put(`/interviews/${rescheduling._id}`, payload);
                setFeedback({ type: 'success', text: 'Interview rescheduled successfully!' });
            } else {
                await API.post('/interviews', { ...payload, applicationId: schedulingFor });
                setFeedback({ type: 'success', text: 'Interview scheduled successfully!' });
            }
            closeForm();
            await loadData();
        } catch (err) {
            setFeedback({
                type: 'error',
                text: err.response?.data?.message || 'Failed to save interview.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (interviewId) => {
        if (!window.confirm('Cancel this interview?')) return;
        try {
            await API.patch(`/interviews/${interviewId}/status`, { status: 'cancelled' });
            await loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel interview.');
        }
    };

    const handleMarkCompleted = async (interviewId) => {
        try {
            await API.patch(`/interviews/${interviewId}/status`, { status: 'completed' });
            await loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update interview status.');
        }
    };

    if (loading) {
        return <div style={styles.card}><p style={styles.subtext}>Loading applicants...</p></div>;
    }

    return (
        <div style={styles.card}>
            <h2 style={styles.heading}>🗓️ Interview Scheduling</h2>
            <p style={styles.subheading}>Schedule, reschedule, or cancel interviews for your applicants.</p>

            {feedback.text && (
                <div style={feedback.type === 'success' ? styles.successBanner : styles.errorBanner}>
                    {feedback.text}
                </div>
            )}

            {applications.length === 0 ? (
                <p style={styles.subtext}>No applicants yet.</p>
            ) : (
                <div style={styles.list}>
                    {applications.map((app) => {
                        const interview = interviewByApplication[app._id];
                        const isFormOpenForThis = schedulingFor === app._id;

                        return (
                            <div key={app._id} style={styles.applicantCard}>
                                <div style={styles.applicantRow}>
                                    <div>
                                        <strong>{app.student?.name || 'Unknown Student'}</strong>
                                        <div style={styles.subtext}>{app.student?.email}</div>
                                        <div style={styles.subtext}>Applied for: {app.job?.title || 'N/A'}</div>
                                        <button onClick={() => toggleProfile(app)} style={styles.linkBtn}>
                                            {expandedProfileFor === app._id ? 'Hide Profile' : 'View Profile & Projects'}
                                        </button>
                                    </div>

                                    {interview ? (
                                        <div style={styles.interviewStatusBox}>
                                            <span style={getStatusStyle(interview.status)}>{interview.status}</span>
                                            <div style={styles.subtext}>
                                                {new Date(interview.scheduledAt).toLocaleString('en-US', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                })}
                                            </div>
                                            {interview.status !== 'cancelled' && interview.status !== 'completed' && (
                                                <div style={styles.actionRow}>
                                                    <button onClick={() => openRescheduleForm(interview)} style={styles.smallBtn}>Reschedule</button>
                                                    <button onClick={() => handleMarkCompleted(interview._id)} style={styles.smallBtn}>Mark Completed</button>
                                                    <button onClick={() => handleCancel(interview._id)} style={styles.smallBtnDanger}>Cancel</button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button onClick={() => openScheduleForm(app._id)} style={styles.scheduleBtn}>
                                            Schedule Interview
                                        </button>
                                    )}
                                </div>

                                {expandedProfileFor === app._id && (
                                    <div style={styles.profilePanel}>
                                        {profileLoading === app.student?._id ? (
                                            <p style={styles.subtext}>Loading profile...</p>
                                        ) : (() => {
                                            const data = profileData[app.student?._id];
                                            if (!data) return null;
                                            if (data.error) return <p style={styles.subtext}>{data.error}</p>;

                                            const { profile, projects } = data;
                                            return (
                                                <>
                                                    <div style={styles.profileGrid}>
                                                        <span><strong>Department:</strong> {profile?.department || 'N/A'}</span>
                                                        <span><strong>CGPA:</strong> {profile?.cgpa ?? 'N/A'}</span>
                                                        <span><strong>Backlogs:</strong> {profile?.backlogs ?? 'N/A'}</span>
                                                        <span><strong>Phone:</strong> {profile?.phone || 'N/A'}</span>
                                                    </div>
                                                    {profile?.skills?.length > 0 && (
                                                        <div style={{ marginTop: '8px' }}>
                                                            <strong style={styles.subtext}>Skills:</strong>{' '}
                                                            {profile.skills.map((s, i) => (
                                                                <span key={i} style={styles.skillTag}>{s}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {profile?.bio && (
                                                        <p style={{ ...styles.subtext, marginTop: '8px' }}>{profile.bio}</p>
                                                    )}
                                                    <div style={{ marginTop: '12px' }}>
                                                        <strong style={styles.subtext}>Projects ({projects.length})</strong>
                                                        {projects.length === 0 ? (
                                                            <p style={styles.subtext}>No projects added.</p>
                                                        ) : (
                                                            projects.map((proj) => (
                                                                <div key={proj._id} style={styles.projectCard}>
                                                                    <strong>{proj.title}</strong>
                                                                    {proj.techStack && <div style={styles.subtext}>{proj.techStack}</div>}
                                                                    {proj.description && <p style={styles.subtext}>{proj.description}</p>}
                                                                    {proj.projectUrl && (
                                                                        <a href={proj.projectUrl} target="_blank" rel="noopener noreferrer" style={styles.subtext}>🔗 {proj.projectUrl}</a>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}

                                {(isFormOpenForThis || (rescheduling && rescheduling.application === app._id)) && (
                                    <form onSubmit={handleSubmit} style={styles.form}>
                                        <div style={styles.formRow}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Date</label>
                                                <input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleFormChange} style={styles.input} required />
                                            </div>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Time</label>
                                                <input type="time" name="scheduledTime" value={formData.scheduledTime} onChange={handleFormChange} style={styles.input} required />
                                            </div>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Duration (min)</label>
                                                <input type="number" name="duration" value={formData.duration} onChange={handleFormChange} style={styles.input} min="10" step="5" />
                                            </div>
                                        </div>

                                        <div style={styles.formRow}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Interview Type</label>
                                                <select name="interviewType" value={formData.interviewType} onChange={handleFormChange} style={styles.input}>
                                                    <option value="Video Call">Video Call</option>
                                                    <option value="Phone Call">Phone Call</option>
                                                    <option value="In-Person">In-Person</option>
                                                </select>
                                            </div>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Meeting Link</label>
                                                <input type="text" name="meetingLink" value={formData.meetingLink} onChange={handleFormChange} placeholder="https://..." style={styles.input} />
                                            </div>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Location</label>
                                                <input type="text" name="location" value={formData.location} onChange={handleFormChange} placeholder="Office address" style={styles.input} />
                                            </div>
                                        </div>

                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Notes</label>
                                            <textarea name="notes" value={formData.notes} onChange={handleFormChange} style={styles.textarea}></textarea>
                                        </div>

                                        <div style={styles.actionRow}>
                                            <button type="submit" disabled={submitting} style={styles.scheduleBtn}>
                                                {submitting ? 'Saving...' : (rescheduling ? 'Confirm Reschedule' : 'Confirm Schedule')}
                                            </button>
                                            <button type="button" onClick={closeForm} style={styles.smallBtn}>Cancel</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const getStatusStyle = (status) => {
    const base = { padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' };
    switch (status) {
        case 'scheduled': return { ...base, backgroundColor: '#dbeafe', color: '#1d4ed8' };
        case 'completed': return { ...base, backgroundColor: '#dcfce7', color: '#15803d' };
        case 'cancelled': return { ...base, backgroundColor: '#fee2e2', color: '#b91c1c' };
        case 'rescheduled': return { ...base, backgroundColor: '#fef3c7', color: '#b45309' };
        default: return base;
    }
};

const styles = {
    card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px' },
    heading: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
    subheading: { fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' },
    subtext: { fontSize: '12px', color: '#64748b' },
    list: { display: 'flex', flexDirection: 'column', gap: '12px' },
    applicantCard: { border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' },
    applicantRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' },
    interviewStatusBox: { textAlign: 'right' },
    actionRow: { display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' },
    scheduleBtn: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    smallBtn: { backgroundColor: '#f1f5f9', color: '#334155', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
    smallBtnDanger: { backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
    linkBtn: { background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: '4px 0', textDecoration: 'underline' },
    profilePanel: { marginTop: '10px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
    profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '13px', color: '#334155' },
    skillTag: { display: 'inline-block', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', marginRight: '6px', marginTop: '4px' },
    projectCard: { marginTop: '8px', padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' },
    form: { marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' },
    formRow: { display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' },
    formGroup: { flex: '1 1 150px' },
    label: { display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' },
    input: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', minHeight: '60px', boxSizing: 'border-box' },
    successBanner: { backgroundColor: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' },
    errorBanner: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }
};

export default InterviewScheduler;