import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

const CompanyDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [jobPosts, setJobPosts] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        location: '',
        jobType: '',
        paymentType: '',
        deadline: ''
    });

    // Helper to extract JWT token
    // Load initial user state and fetch this company's own job postings
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        let parsedUser = null;
        if (storedUser) {
            try {
                parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        }

        if (parsedUser?.id) {
            fetchCompanyJobs(parsedUser.id);
        } else {
            setLoadingJobs(false);
        }
    }, []);

    const fetchCompanyJobs = async (companyId) => {
        setLoadingJobs(true);
        try {
            // Only this company's own postings, not every job in the system.
            const response = await API.get(`/portal/jobs/company/${companyId}`);
            setJobPosts(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Could not fetch company jobs:', err);
            setFeedbackMsg({
                type: 'error',
                text: err.response?.data?.message || 'Could not load your job postings. Please refresh the page.'
            });
            setJobPosts([]);
        } finally {
            setLoadingJobs(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePublishJob = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description || !formData.deadline) return;

        setSubmitting(true);
        setFeedbackMsg({ type: '', text: '' });

        const payload = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            requirements: formData.requirements.trim() || 'N/A',
            location: formData.location.trim() || 'Remote',
            jobType: formData.jobType || null,
            paymentType: formData.paymentType || null,
            deadline: formData.deadline
        };

                try {
            const res = await API.post('/jobs', payload);
            const createdJob = res.data?.job || res.data;

            setJobPosts((prev) => [createdJob, ...prev]);
            setFormData({ title: '', description: '', requirements: '', location: '', jobType: '', paymentType: '', deadline: '' });
            setFeedbackMsg({ type: 'success', text: '🎉 Opportunity published successfully!' });
        } catch (err) {
            console.error('Error publishing job:', err);
            setFeedbackMsg({
                type: 'error',
                text: err.response?.data?.message || 'Failed to publish job. Please try again.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const companyName = user?.name || user?.username || user?.companyName || 'Company';

    return (
        <div style={styles.container}>
            {/* Top Navbar */}
            <header style={styles.topNav}>
                <div style={styles.navLeft}>
                    <div style={styles.brandLogo}>
                        <div style={styles.logoIcon}>🛡️</div>
                        <span style={styles.brandName}>HireHive</span>
                    </div>
                    <span style={styles.navDivider}>|</span>
                    <span style={styles.breadcrumb}>Dashboard &gt; <strong style={{ color: '#2563eb' }}>Company</strong></span>
                </div>
                <div style={styles.navRight}>
                    <button style={styles.iconBtn}>🔔 <span style={styles.notificationDot}>1</span></button>
                    <div style={styles.avatarBox}>{companyName.charAt(0).toUpperCase()}</div>
                    <div style={styles.userMeta}>
                        <div style={styles.userTitle}>{companyName}</div>
                        <div style={styles.userRole}>Company</div>
                    </div>
                    <button onClick={handleLogout} style={styles.signOutBtn}>🚪 Sign Out</button>
                </div>
            </header>

            <main style={styles.mainWrapper}>
                {/* Hero Gradient Banner */}
                <div style={styles.heroBanner}>
                    <div style={styles.heroLeft}>
                        <div style={styles.workspacePill}>• Company Workspace</div>
                        <h1 style={styles.heroTitle}>Welcome back, {companyName} 👋</h1>
                        <p style={styles.heroSubtitle}>Broadcast fresh internship opportunities, review applicant project history, and track team hiring milestones.</p>

                        <div style={styles.metricsRow}>
                            <div style={styles.metricCard}>
                                <div style={styles.metricNumber}>{jobPosts.length}</div>
                                <div style={styles.metricLabel}>Active Posts</div>
                            </div>
                            <div style={styles.metricCard}>
                                <div style={styles.metricNumber}>0</div>
                                <div style={styles.metricLabel}>Saved Jobs</div>
                            </div>
                            <div style={styles.metricCard}>
                                <div style={styles.metricNumber}>—</div>
                                <div style={styles.metricLabel}>Profile Score</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Section Grid */}
                <div style={styles.gridContainer}>
                    {/* Left Form & Postings Column */}
                    <div style={styles.leftCol}>
                        {/* Job Posting Form */}
                        <div style={styles.card}>
                            <div style={styles.cardTitleRow}>
                                <span style={styles.cardHeaderIcon}>💼</span>
                                <div>
                                    <h2 style={styles.cardHeading}>Post a New Job Opening</h2>
                                    <p style={styles.cardSubheading}>Provide detailed requirements for target students</p>
                                </div>
                            </div>

                            {feedbackMsg.text && (
                                <div style={feedbackMsg.type === 'success' ? styles.successBanner : styles.errorBanner}>
                                    {feedbackMsg.text}
                                </div>
                            )}

                                                        <form onSubmit={handlePublishJob} style={styles.form}>
                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Job Title <span style={styles.required}>*</span></label>
                                    <input 
                                        type="text" 
                                        name="title"
                                        value={formData.title} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g. Full Stack Developer Intern" 
                                        style={styles.input} 
                                        required
                                    />
                                </div>

                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Job Description <span style={styles.required}>*</span></label>
                                    <textarea 
                                        name="description"
                                        value={formData.description} 
                                        onChange={handleInputChange} 
                                        placeholder="Outline day-to-day operations and stack tools..." 
                                        style={styles.textarea} 
                                        required
                                    ></textarea>
                                </div>

                                <div style={styles.twoCol}>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>Requirements</label>
                                        <input 
                                            type="text" 
                                            name="requirements"
                                            value={formData.requirements} 
                                            onChange={handleInputChange} 
                                            placeholder="e.g. React, MySQL, PHP" 
                                            style={styles.input} 
                                        />
                                    </div>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>Location</label>
                                        <input 
                                            type="text" 
                                            name="location"
                                            value={formData.location} 
                                            onChange={handleInputChange} 
                                            placeholder="e.g. Remote / On-site" 
                                            style={styles.input} 
                                        />
                                    </div>
                                </div>

                                <div style={styles.twoCol}>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>Job Type</label>
                                        <select
                                            name="jobType"
                                            value={formData.jobType}
                                            onChange={handleInputChange}
                                            style={styles.input}
                                        >
                                            <option value="">-- Not specified --</option>
                                            <option value="Remote">Remote</option>
                                            <option value="On-site">On-site</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>Payment Type</label>
                                        <select
                                            name="paymentType"
                                            value={formData.paymentType}
                                            onChange={handleInputChange}
                                            style={styles.input}
                                        >
                                            <option value="">-- Not specified --</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Unpaid">Unpaid</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Application Deadline Date <span style={styles.required}>*</span></label>
                                    <input 
                                        type="date" 
                                        name="deadline"
                                        value={formData.deadline} 
                                        onChange={handleInputChange} 
                                        style={styles.input} 
                                        required
                                    />
                                </div>

                                <button type="submit" disabled={submitting} style={{ ...styles.publishBtn, opacity: submitting ? 0.7 : 1 }}>
                                    {submitting ? 'Publishing...' : '+ Publish Job Post'}
                                </button>
                            </form>
                        </div>

                        {/* Active Postings List */}
                        <div style={styles.card}>
                            <div style={styles.cardTitleRowBetween}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={styles.cardHeaderIcon}>📋</span>
                                    <div>
                                        <h2 style={styles.cardHeading}>Your Active Job Postings</h2>
                                        <p style={styles.cardSubheading}>Track and manage your listed internal positions</p>
                                    </div>
                                </div>
                                <span style={styles.pillBadge}>{jobPosts.length} active</span>
                            </div>

                            <div style={styles.postingsList}>
                                {loadingJobs ? (
                                    <p style={{ fontSize: '13px', color: '#64748b' }}>Loading positions...</p>
                                ) : jobPosts.length === 0 ? (
                                    <p style={{ fontSize: '13px', color: '#64748b' }}>No active opportunities posted yet.</p>
                                ) : (
                                    jobPosts.map((job) => (
                                        <div key={job._id || job.id} style={styles.jobItemCard}>
                                            <div style={styles.jobItemTop}>
                                                <h3 style={styles.jobTitle}>{job.title}</h3>
                                                <span style={styles.liveTag}>Live Feed</span>
                                            </div>
                                            <p style={styles.jobDesc}>{job.description}</p>
                                            <div style={styles.jobFooterMeta}>
                                                <span>📍 {job.location || job.type || 'Remote'}</span>
                                                <span>• 🛠️ Skills: {job.requirements || job.skills || 'N/A'}</span>
                                                <span>• 📅 Deadline: <strong style={{ color: '#ef4444' }}>{job.deadline}</strong></span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side Widgets Column */}
                    <div style={styles.rightCol}>
                        <div style={styles.sideWidget}>
                            <div style={styles.widgetHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🔔</span>
                                    <div>
                                        <strong style={{ fontSize: '14px', color: '#1e293b' }}>Alerts Feed</strong>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>1 unread</div>
                                    </div>
                                </div>
                                <div style={styles.widgetActions}>
                                    <span style={styles.textLink}>Mark all read</span>
                                    <span>↗️</span>
                                </div>
                            </div>
                            <div style={styles.alertBanner}>
                                🎉 You have received a new applicant submission for your position: <strong>"Backend Web Developer Intern"</strong>!
                                <div style={styles.alertTime}>7/10/2026, 10:43:25 PM</div>
                            </div>
                        </div>

                        <div style={styles.sideWidgetRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>⚡</span>
                                <span style={styles.widgetTitleText}>Skill Match Score</span>
                            </div>
                            <span style={styles.comingSoonTag}>COMING SOON</span>
                        </div>

                        <div style={styles.sideWidgetRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>✅</span>
                                <span style={styles.widgetTitleText}>Eligibility Status</span>
                            </div>
                            <span style={styles.comingSoonTag}>COMING SOON</span>
                        </div>

                        <div style={styles.sideWidgetRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📄</span>
                                <span style={styles.widgetTitleText}>Resume Builder</span>
                            </div>
                            <span style={styles.comingSoonTag}>COMING SOON</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#334155' },
    topNav: { height: '60px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' },
    navLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    brandLogo: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '16px', color: '#0f172a' },
    logoIcon: { backgroundColor: '#2563eb', color: '#fff', padding: '4px', borderRadius: '6px', fontSize: '12px' },
    brandName: { color: '#1e293b' },
    navDivider: { color: '#cbd5e1' },
    breadcrumb: { fontSize: '13px', color: '#64748b' },
    navRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    iconBtn: { position: 'relative', background: 'none', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' },
    notificationDot: { position: 'absolute', top: '-2px', right: '-2px', backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    avatarBox: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px' },
    userMeta: { lineHeight: '1.2' },
    userTitle: { fontSize: '12px', fontWeight: '600', color: '#1e293b' },
    userRole: { fontSize: '10px', color: '#64748b' },
    signOutBtn: { padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500', marginLeft: '8px' },
    mainWrapper: { maxWidth: '1280px', margin: '0 auto', padding: '20px' },
    heroBanner: { background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0d9488 100%)', borderRadius: '16px', padding: '32px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    heroLeft: { maxWidth: '700px' },
    workspacePill: { display: 'inline-block', backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', marginBottom: '12px' },
    heroTitle: { fontSize: '28px', fontWeight: '700', marginBottom: '8px' },
    heroSubtitle: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '24px', lineHeight: '1.4' },
    metricsRow: { display: 'flex', gap: '12px' },
    metricCard: { backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: '10px', minWidth: '90px' },
    metricNumber: { fontSize: '22px', fontWeight: '700' },
    metricLabel: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' },
    gridContainer: { display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '20px' },
    leftCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
    rightCol: { display: 'flex', flexDirection: 'column', gap: '12px' },
    card: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' },
    cardTitleRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
    cardTitleRowBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    cardHeaderIcon: { fontSize: '18px', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '8px' },
    cardHeading: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 },
    cardSubheading: { fontSize: '12px', color: '#64748b', margin: 0 },
    pillBadge: { backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: '500' },
    successBanner: { backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
    errorBanner: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '12px', fontWeight: '600', color: '#334155' },
    required: { color: '#ef4444' },
    input: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' },
    textarea: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', minHeight: '90px', resize: 'vertical', outline: 'none' },
    twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    publishBtn: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', marginTop: '8px' },
    postingsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    jobItemCard: { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' },
    jobItemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
    jobTitle: { fontSize: '14px', fontWeight: '700', color: '#1e3a8a', margin: 0 },
    liveTag: { backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' },
    jobDesc: { fontSize: '12px', color: '#475569', lineHeight: '1.4', marginBottom: '10px' },
    jobFooterMeta: { fontSize: '11px', color: '#64748b', display: 'flex', gap: '6px', flexWrap: 'wrap' },
    sideWidget: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' },
    widgetHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    widgetActions: { fontSize: '11px', color: '#2563eb', display: 'flex', gap: '4px', cursor: 'pointer' },
    textLink: { textDecoration: 'underline' },
    alertBanner: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#1e40af', lineHeight: '1.4' },
    alertTime: { fontSize: '10px', color: '#60a5fa', marginTop: '6px' },
    sideWidgetRow: { backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    widgetTitleText: { fontSize: '13px', fontWeight: '600', color: '#334155' },
    comingSoonTag: { backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '10px', padding: '3px 6px', borderRadius: '4px', fontWeight: '600' }
};

export default CompanyDashboard;