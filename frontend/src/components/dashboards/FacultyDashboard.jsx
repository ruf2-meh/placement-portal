import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import DashboardHeader from '../DashboardHeader';
import CreateJobModal from '../CreateJobModal';

const FacultyDashboard = () => {
    // --- State Variables ---
    const [user, setUser] = useState(null);
    const [postedJobs, setPostedJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State for Inline Job Posting
    const [newJob, setNewJob] = useState({
        title: '',
        companyId: '',
        description: '',
        location: '',
        requirements: '',
        type: 'Remote',
        deadline: ''
    });

    // --- Fetch Data ---
    useEffect(() => {
        const fetchFacultyData = async () => {
            try {
                setLoading(true);
                const [userRes, jobsRes, appsRes, compRes] = await Promise.allSettled([
                    API.get('/auth/me'),
                    API.get('/portal/faculty/jobs'),
                    API.get('/portal/faculty/applications'),
                    API.get('/companies')
                ]);

                if (userRes.status === 'fulfilled') setUser(userRes.value.data);
                if (jobsRes.status === 'fulfilled') setPostedJobs(jobsRes.value.data || []);
                if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data || []);
                if (compRes.status === 'fulfilled') setCompanies(compRes.value.data || []);
            } catch (err) {
                console.error("Error loading faculty data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFacultyData();
    }, []);

    // --- Actions ---
    const handlePostJob = async (e) => {
        e.preventDefault();
        if (!newJob.title || !newJob.description) {
            return alert("Please fill out all required fields.");
        }

        try {
            const res = await API.post('/jobs', newJob);
            alert("Job posted successfully!");
            setPostedJobs([...postedJobs, res.data]);
            setNewJob({ title: '', companyId: '', description: '', location: '', requirements: '', type: 'Remote', deadline: '' });
        } catch (err) {
            alert(err.response?.data?.message || "Failed to post job.");
        }
    };

    const handleStatusUpdate = async (appId, newStatus) => {
        try {
            await API.patch(`/portal/applications/${appId}`, { status: newStatus });
            setApplications(applications.map(app => 
                (app._id === appId || app.id === appId) ? { ...app, status: newStatus } : app
            ));
            alert(`Application status updated to ${newStatus}`);
        } catch (err) {
            alert("Failed to update status.");
        }
    };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading Faculty Dashboard...</div>;
    }

    const userName = user?.name || user?.fullName || 'Faculty Member';

    return (
        <>
            <DashboardHeader user={user} roleName="Faculty" />
            <div style={styles.container}>
                {/* BANNER */}
                <div style={styles.banner}>
                    <span style={styles.badge}>• Faculty Workspace</span>
                    <h1 style={styles.welcomeText}>Welcome back, Professor {userName} 👋</h1>
                    <p style={styles.bannerSub}>Post new internship roles, evaluate student applications, and oversee program placements.</p>

                    <div style={styles.statsRow}>
                        <div style={styles.statCard}>
                            <span style={styles.statNumber}>{postedJobs.length}</span>
                            <span style={styles.statLabel}>Active Listings</span>
                        </div>
                        <div style={styles.statCard}>
                            <span style={styles.statNumber}>{applications.length}</span>
                            <span style={styles.statLabel}>Total Applicants</span>
                        </div>
                    </div>
                </div>

                {/* MAIN GRID */}
                <div style={styles.gridContainer}>
                    {/* LEFT COLUMN: POST JOB & LISTINGS */}
                    <div style={styles.leftCol}>
                        {/* POST NEW JOB */}
                        <div style={styles.sectionCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={styles.sectionTitle}>📢 Post New Internship Opportunity</h2>
                                    <p style={styles.sectionSub}>Create a new role for eligible students to apply</p>
                                </div>
                                <button onClick={() => setIsModalOpen(true)} style={styles.modalTriggerBtn}>
                                    + Open Modal Form
                                </button>
                            </div>

                            <form onSubmit={handlePostJob} style={{ marginTop: '16px' }}>
                                {/* COMPANY DROPDOWN */}
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={styles.label}>Associated Company</label>
                                    <select
                                        value={newJob.companyId}
                                        onChange={(e) => setNewJob({ ...newJob, companyId: e.target.value })}
                                        style={styles.input}
                                    >
                                        <option value="">-- Direct Faculty Posting (No Company) --</option>
                                        {companies.map((comp) => (
                                            <option key={comp._id || comp.id} value={comp._id || comp.id}>
                                                {comp.name || comp.companyName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={styles.formRow}>
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.label}>Job Title *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Software Engineer Intern"
                                            value={newJob.title}
                                            onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                                            style={styles.input}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.label}>Location</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Remote / New York"
                                            value={newJob.location}
                                            onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                                            style={styles.input}
                                        />
                                    </div>
                                </div>

                                <div style={styles.formRow}>
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.label}>Job Type</label>
                                        <select
                                            value={newJob.type}
                                            onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                                            style={styles.input}
                                        >
                                            <option value="Remote">Remote</option>
                                            <option value="On-site">On-site</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.label}>Application Deadline</label>
                                        <input
                                            type="date"
                                            value={newJob.deadline}
                                            onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })}
                                            style={styles.input}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '12px' }}>
                                    <label style={styles.label}>Required Skills / Requirements</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. React, PHP, MySQL, Basic Git"
                                        value={newJob.requirements}
                                        onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>

                                <div style={{ marginTop: '12px' }}>
                                    <label style={styles.label}>Job Description *</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Describe the responsibilities and scope..."
                                        value={newJob.description}
                                        onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                                        style={styles.textarea}
                                    />
                                </div>

                                <button type="submit" style={styles.primaryBtn}>Publish Opportunity</button>
                            </form>
                        </div>

                        {/* MANAGED LISTINGS */}
                        <div style={{ ...styles.sectionCard, marginTop: '24px' }}>
                            <div style={styles.sectionHeader}>
                                <h2 style={styles.sectionTitle}>📋 Active Listings ({postedJobs.length})</h2>
                            </div>

                            {postedJobs.length === 0 ? (
                                <p style={{ fontSize: '13px', color: '#64748b' }}>No active listings posted yet.</p>
                            ) : (
                                postedJobs.map((job) => (
                                    <div key={job._id || job.id} style={styles.cardItem}>
                                        <h4 style={styles.itemTitle}>{job.title}</h4>
                                        {(job.companyName || job.company?.name) && (
                                            <p style={styles.companyTag}>🏢 {job.companyName || job.company?.name}</p>
                                        )}
                                        <p style={styles.itemSub}>{job.description}</p>
                                        <span style={styles.metaBadge}>{job.location || 'Remote'}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: APPLICATIONS REVIEW */}
                    <div style={styles.rightCol}>
                        <div style={styles.sectionCard}>
                            <h3 style={styles.sectionTitle}>📥 Student Applications</h3>
                            <p style={styles.sectionSub}>Review pending submissions</p>

                            <div style={{ marginTop: '16px' }}>
                                {applications.length === 0 ? (
                                    <p style={{ fontSize: '13px', color: '#64748b' }}>No pending applications to review.</p>
                                ) : (
                                    applications.map((app) => (
                                        <div key={app._id || app.id} style={styles.appCard}>
                                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                                                {app.studentName || app.user?.name || 'Student Applicant'}
                                            </strong>
                                            <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0' }}>
                                                Applied for: <strong>{app.jobTitle || app.job?.title || 'Internship'}</strong>
                                            </p>
                                            <div style={{ margin: '8px 0' }}>
                                                <span style={{ ...styles.statusTag, backgroundColor: app.status === 'Accepted' ? '#dcfce7' : '#f1f5f9' }}>
                                                    Status: {app.status || 'Pending'}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                                <button
                                                    onClick={() => handleStatusUpdate(app._id || app.id, 'Accepted')}
                                                    style={styles.acceptBtn}
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(app._id || app.id, 'Rejected')}
                                                    style={styles.rejectBtn}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CREATE JOB MODAL COMPONENT */}
            <CreateJobModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onJobCreated={(createdJob) => setPostedJobs(prev => [...prev, createdJob])}
            />
        </>
    );
};

// --- STYLES ---
const styles = {
    container: { backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' },
    banner: { backgroundColor: '#0d9488', borderRadius: '16px', padding: '32px', color: '#ffffff' },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    welcomeText: { fontSize: '28px', fontWeight: '800', margin: '12px 0 6px 0' },
    bannerSub: { fontSize: '14px', color: '#ccfbf1', margin: 0 },
    statsRow: { display: 'flex', gap: '16px', marginTop: '24px' },
    statCard: { backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '16px 24px', borderRadius: '12px', minWidth: '120px' },
    statNumber: { display: 'block', fontSize: '22px', fontWeight: '800' },
    statLabel: { fontSize: '11px', color: '#ccfbf1' },
    gridContainer: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginTop: '24px' },
    leftCol: { display: 'flex', flexDirection: 'column' },
    rightCol: { display: 'flex', flexDirection: 'column' },
    sectionCard: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 },
    sectionSub: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    formRow: { display: 'flex', gap: '12px', marginTop: '12px' },
    label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' },
    input: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
    primaryBtn: { backgroundColor: '#0d9488', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '600', cursor: 'pointer', marginTop: '16px' },
    modalTriggerBtn: { backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    cardItem: { border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '12px' },
    itemTitle: { fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' },
    companyTag: { fontSize: '12px', fontWeight: '600', color: '#2563eb', margin: '0 0 6px 0' },
    itemSub: { fontSize: '13px', color: '#475569', margin: '0 0 8px 0' },
    metaBadge: { backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' },
    appCard: { border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginBottom: '12px' },
    statusTag: { fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', color: '#166534' },
    acceptBtn: { flex: 1, backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    rejectBtn: { flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }
};

export default FacultyDashboard;