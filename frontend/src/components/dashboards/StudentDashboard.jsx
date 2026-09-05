import React, { useState, useEffect, useMemo } from 'react';
import API from '../../api/axios';
import YourCompatibilityWidget from '../YourCompatibilityWidget';
import DashboardHeader from '../DashboardHeader';
import ProfileCompletion from '../ProfileCompletion';
import SkillGapAnalyzer from '../SkillGapAnalyzer';
import InterviewStatusTracker from '../InterviewStatusTracker';


// Reads the logged-in student's own id from what Login.jsx stored at login
// time. Several fetches below need this (applications, notifications,
// projects) — previously none of them had any way to know who "you" were,
// so they were all called without an id and silently failed.
const getStoredUserId = () => {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser)?.id : null;
    } catch (e) {
        console.error('Failed to parse stored user', e);
        return null;
    }
};

const StudentDashboard = () => {
    // --- State Variables ---
    const [user, setUser] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    

    // UI Action States
    const [applyingId, setApplyingId] = useState(null);
    const [submittingProject, setSubmittingProject] = useState(false);

    // Search and Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    // Profile form visibility
    const [showProfileForm, setShowProfileForm] = useState(false);


    // Portfolio Form State
    const [newProject, setNewProject] = useState({
        title: '',
        techStack: '',
        description: '',
        link: ''
    });

    // --- Fetch Live Data ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                const studentId = getStoredUserId();
                const noId = Promise.reject(new Error('No student ID available'));

                 const [userRes, jobsRes, appsRes, notifsRes, projectsRes] = await Promise.allSettled([
                    API.get('/auth/me'),
                    API.get('/jobs'),
                    studentId ? API.get(`/portal/applications/${studentId}`) : noId,
                    studentId ? API.get(`/portal/notifications/${studentId}`) : noId,
                    studentId ? API.get(`/portal/projects/${studentId}`) : noId
                ]);

                if (userRes.status === 'fulfilled') setUser(userRes.value.data);
                if (jobsRes.status === 'fulfilled') {
                    const jobData = jobsRes.value.data.jobs || jobsRes.value.data || [];
                    setJobs(jobData);
                }
                if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data || []);
                if (notifsRes.status === 'fulfilled') setNotifications(notifsRes.value.data || []);
                if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.data || []);


            } catch (err) {
                console.error("Error loading dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // --- Memoized Filtered Jobs ---
    const filteredJobs = useMemo(() => {
        return jobs.filter(j => {
            const matchesSearch = searchTerm.trim() === '' || 
                (j.title && j.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (j.location && j.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (j.description && j.description.toLowerCase().includes(searchTerm.toLowerCase()));

            if (activeFilter === 'All') return matchesSearch;

            const paymentFilters = ['Paid', 'Unpaid'];
            let matchesFilter;

            if (paymentFilters.includes(activeFilter)) {
                matchesFilter = (j.paymentType || '').toLowerCase() === activeFilter.toLowerCase();
            } else {
                const jobType = (j.jobType || '').toLowerCase();
                const loc = (j.location || '').toLowerCase();
                const target = activeFilter.toLowerCase();
                matchesFilter = jobType === target || loc.includes(target);
            }

            return matchesSearch && matchesFilter;
        });
    }, [searchTerm, activeFilter, jobs]);

    // Set of applied job IDs for quick lookup
    const appliedJobIds = useMemo(() => {
        return new Set(applications.map(app => app.jobId || app.job?._id || app.job));
    }, [applications]);

    // --- Actions ---
    const handleApply = async (jobId) => {
        try {
            setApplyingId(jobId);
            await API.post(`/jobs/${jobId}/apply`);
            alert("Application submitted successfully!");

            const studentId = getStoredUserId();
            if (studentId) {
                const appsRes = await API.get(`/portal/applications/${studentId}`);
                setApplications(appsRes.data || []);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to apply for job.");
        } finally {
            setApplyingId(null);
        }
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!newProject.title.trim()) return alert("Please enter a project title.");

        const studentId = getStoredUserId();
        if (!studentId) {
            return alert("Could not identify your account. Please log in again.");
        }

        try {
            setSubmittingProject(true);
            const res = await API.post('/portal/projects', { ...newProject, student: studentId });
            setProjects(prev => [...prev, res.data.project || res.data]);
            setNewProject({ title: '', techStack: '', description: '', link: '' });
        } catch (err) {
            alert("Failed to add project.");
        } finally {
            setSubmittingProject(false);
        }
    };
    const handleDeleteProject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        
        try {
            await API.delete(`/portal/projects/${id}`);
            setProjects(prev => prev.filter(p => (p._id || p.id) !== id));
        } catch (err) {
            alert("Failed to delete project.");
        }
    };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading your dashboard...</div>;
    }

    const userName = user?.name || user?.fullName || 'Student';

    return (
        <>
            <DashboardHeader user={user} roleName="Student" />
            <div style={styles.container}>
                {/* TOP WELCOME BANNER */}
                <div style={styles.banner}>
                    <span style={styles.badge}>• Student Workspace</span>
                    <h1 style={styles.welcomeText}>Welcome back, {userName} 👋</h1>
                    <p style={styles.bannerSub}>Search internships, manage your portfolio, and stay updated with important notifications.</p>

                    {/* STATS OVERLAY */}
                    <div style={styles.statsRow}>
                        <div style={styles.statCard}>
                            <span style={styles.statNumber}>{applications.length}</span>
                            <span style={styles.statLabel}>Applications</span>
                        </div>
                        <div style={styles.statCard}>
                            <span style={styles.statNumber}>0</span>
                            <span style={styles.statLabel}>Saved Jobs</span>
                        </div>
                        <div style={styles.statCard}>
                            <span style={styles.statNumber}>—</span>
                            <span style={styles.statLabel}>Profile Score</span>
                        </div>
                    </div>
                </div>

                {/* MAIN TWO-COLUMN GRID */}
                <div style={styles.gridContainer}>

                    {/* LEFT COLUMN: SEARCH & JOBS */}
                    <div style={styles.leftCol}>
                        <div style={styles.sectionCard}>
                            <div style={styles.sectionHeader}>
                                <div>
                                    <h2 style={styles.sectionTitle}>👤 Your Profile</h2>
                                    <p style={styles.sectionSub}>Keep your skills, CGPA, and backlogs up to date — this is what compatibility scores and eligibility checks are based on.</p>
                                </div>
                                <button
                                    onClick={() => setShowProfileForm((prev) => !prev)}
                                    style={{ ...styles.countBadge, border: 'none', cursor: 'pointer' }}
                                >
                                    {showProfileForm ? 'Hide' : 'Edit Profile'}
                                </button>
                            </div>
                            {showProfileForm && (
                                <ProfileCompletion
                                    userId={getStoredUserId()}
                                    onProfileSaved={() => setShowProfileForm(false)}
                                />
                            )}
                        </div>

                        <div style={styles.sectionCard}>
                            <div style={styles.sectionHeader}>
                                <div>
                                    <h2 style={styles.sectionTitle}>🔍 Search Internship Opportunities</h2>
                                    <p style={styles.sectionSub}>Browse and filter available positions</p>
                                </div>
                                <span style={styles.countBadge}>{filteredJobs.length} results</span>
                            </div>

                            {/* SEARCH BAR */}
                            <div style={styles.searchBarContainer}>
                                <input
                                    type="text"
                                    placeholder="Filter by Job Title or Location..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={styles.searchInput}
                                />
                            </div>

                            {/* FILTER PILLS */}
                            <div style={styles.pillsContainer}>
                                {['Remote', 'On-site', 'Hybrid', 'Paid', 'Unpaid'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(activeFilter === filter ? 'All' : filter)}
                                        style={{
                                            ...styles.pill,
                                            backgroundColor: activeFilter === filter ? '#2563eb' : '#ffffff',
                                            color: activeFilter === filter ? '#ffffff' : '#475569',
                                            borderColor: activeFilter === filter ? '#2563eb' : '#cbd5e1'
                                        }}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            {/* JOB LISTINGS */}
                            {filteredJobs.length === 0 ? (
                                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '20px' }}>No positions found matching your criteria.</p>
                            ) : (
                                filteredJobs.map((job) => {
                                    const jobId = job._id || job.id;
                                    const isApplied = appliedJobIds.has(jobId);
                                    const isApplying = applyingId === jobId;

                                    return (
                                        <div key={jobId} style={styles.jobCard}>
                                            <h3 style={styles.jobTitle}>{job.title}</h3>
                                            <p style={styles.jobDesc}>{job.description}</p>
                                            
                                            <div style={styles.jobMeta}>
                                                <span>📍 {job.location || 'Remote'}</span>
                                                <span>•</span>
                                                <span>📋 Requirements: <strong>{job.requirements || job.skills || 'N/A'}</strong></span>
                                                <span>•</span>
                                                <span style={{ color: '#dc2626' }}>⏰ Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</span>
                                            </div>

                                            <YourCompatibilityWidget jobId={jobId} />
                                            <SkillGapAnalyzer jobId={jobId} />

                                            <button 
                                                onClick={() => handleApply(jobId)} 
                                                disabled={isApplied || isApplying}
                                                style={{
                                                    ...styles.applyBtn,
                                                    backgroundColor: isApplied ? '#94a3b8' : '#10b981',
                                                    cursor: isApplied || isApplying ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {isApplying ? "Submitting..." : isApplied ? "Applied ✓" : "Apply For Role"}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* PORTFOLIO SHOWCASE */}
                        <div style={{ ...styles.sectionCard, marginTop: '24px' }}>
                            <div style={styles.sectionHeader}>
                                <div>
                                    <h2 style={styles.sectionTitle}>📁 Project Portfolio Showcase</h2>
                                    <p style={styles.sectionSub}>Highlight your work to stand out to recruiters</p>
                                </div>
                                <span style={styles.countBadge}>{projects.length} projects</span>
                            </div>

                            {/* ADD PROJECT FORM */}
                            <form onSubmit={handleAddProject} style={styles.projectForm}>
                                <div style={styles.formRow}>
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.label}>Project Title *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. E-Commerce Web App"
                                            value={newProject.title}
                                            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                            style={styles.input}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.label}>Tech Stack</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. React, Node.js, MySQL"
                                            value={newProject.techStack}
                                            onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })}
                                            style={styles.input}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '12px' }}>
                                    <label style={styles.label}>Description</label>
                                    <textarea
                                        rows="2"
                                        placeholder="Briefly describe what this project does..."
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        style={styles.textarea}
                                    />
                                </div>

                                <div style={{ marginTop: '12px' }}>
                                    <label style={styles.label}>Live Demo / GitHub URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://github.com/..."
                                        value={newProject.link}
                                        onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={submittingProject}
                                    style={{
                                        ...styles.addProjectBtn,
                                        opacity: submittingProject ? 0.7 : 1,
                                        cursor: submittingProject ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {submittingProject ? 'Adding...' : '+ Add Project'}
                                </button>
                            </form>

                            {/* PROJECT LISTING / EMPTY STATE */}
                            {projects.length === 0 ? (
                                <div style={styles.emptyProjects}>
                                    <div style={{ fontSize: '32px' }}>📁</div>
                                    <strong>No projects added yet.</strong>
                                    <p style={{ fontSize: '13px', color: '#64748b' }}>Showcase your projects to improve your internship profile and attract recruiters.</p>
                                </div>
                            ) : (
                                projects.map((p) => {
                                    const projId = p._id || p.id;
                                    return (
                                        <div key={projId} style={styles.projectCard}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h4 style={styles.projectCardTitle}>
                                                        🌟 {p.title} {p.techStack && <span style={styles.techTag}>{p.techStack}</span>}
                                                    </h4>
                                                    <p style={styles.projectCardDesc}>{p.description}</p>
                                                    {p.link && (
                                                        <a href={p.link} target="_blank" rel="noreferrer" style={styles.projectLink}>
                                                            🔗 {p.link}
                                                        </a>
                                                    )}
                                                </div>
                                                <button onClick={() => handleDeleteProject(projId)} style={styles.deleteBtn}>
                                                    🗑 Delete
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <InterviewStatusTracker role="student" />
                    </div>

                    {/* RIGHT COLUMN: SIDEBAR ALERTS */}
                    <div style={styles.rightCol}>
                        <div style={styles.sectionCard}>
                            <div style={styles.sectionHeader}>
                                <h3 style={{ ...styles.sectionTitle, fontSize: '16px' }}>🔔 Alerts Feed</h3>
                                <span style={{ fontSize: '12px', color: '#2563eb', cursor: 'pointer' }}>Mark all read</span>
                            </div>

                            {notifications.length === 0 ? (
                                <div style={styles.alertBox}>
                                    <span>✔</span>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '600', fontSize: '13px' }}>No new notifications.</p>
                                    </div>
                                </div>
                            ) : (
                                notifications.map((n, i) => (
                                    <div key={n._id || i} style={styles.alertBox}>
                                        <span style={{ color: '#16a34a' }}>✔</span>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>
                                                {n.message || n.title}
                                            </p>
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* COMING SOON WIDGETS */}
                        <div style={{ ...styles.sectionCard, marginTop: '16px' }}>
                            <div style={styles.comingSoonRow}>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>⚡ Skill Match Score</span>
                                <span style={styles.comingBadge}>COMING SOON</span>
                            </div>
                        </div>

                        <div style={{ ...styles.sectionCard, marginTop: '12px' }}>
                            <div style={styles.comingSoonRow}>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>☑ Eligibility Status</span>
                                <span style={styles.comingBadge}>COMING SOON</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// --- STYLES OBJECT ---
const styles = {
    container: { backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' },
    banner: { backgroundColor: '#0284c7', borderRadius: '16px', padding: '32px', color: '#ffffff', position: 'relative' },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    welcomeText: { fontSize: '28px', fontWeight: '800', margin: '12px 0 6px 0' },
    bannerSub: { fontSize: '14px', color: '#e0f2fe', margin: 0 },
    statsRow: { display: 'flex', gap: '16px', marginTop: '24px' },
    statCard: { backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: '12px', minWidth: '110px' },
    statNumber: { display: 'block', fontSize: '22px', fontWeight: '800' },
    statLabel: { fontSize: '11px', color: '#e0f2fe' },
    gridContainer: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginTop: '24px' },
    leftCol: { display: 'flex', flexDirection: 'column' },
    rightCol: { display: 'flex', flexDirection: 'column' },
    sectionCard: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 },
    sectionSub: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    countBadge: { backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    searchBarContainer: { display: 'flex', gap: '12px', marginBottom: '16px' },
    searchInput: { flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' },
    pillsContainer: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
    pill: { padding: '6px 16px', borderRadius: '20px', border: '1px solid', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
    jobCard: { border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
    jobTitle: { fontSize: '16px', fontWeight: '700', color: '#2563eb', margin: '0 0 8px 0' },
    jobDesc: { fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 12px 0' },
    jobMeta: { fontSize: '12px', color: '#64748b', display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
    applyBtn: { color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '600', marginTop: '12px', transition: 'background-color 0.2s' },
    projectForm: { backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' },
    formRow: { display: 'flex', gap: '12px' },
    label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' },
    input: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
    addProjectBtn: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', marginTop: '12px' },
    emptyProjects: { textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' },
    projectCard: { border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '12px', backgroundColor: '#ffffff' },
    projectCardTitle: { fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' },
    techTag: { backgroundColor: '#f1f5f9', color: '#6366f1', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px' },
    projectCardDesc: { fontSize: '13px', color: '#475569', margin: '4px 0 8px 0' },
    projectLink: { fontSize: '12px', color: '#2563eb', textDecoration: 'none' },
    deleteBtn: { backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
    alertBox: { display: 'flex', gap: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '10px', marginBottom: '10px' },
    comingSoonRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    comingBadge: { backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '6px' }
};

export default StudentDashboard;