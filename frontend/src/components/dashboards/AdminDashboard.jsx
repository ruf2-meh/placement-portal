import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import DashboardHeader from '../DashboardHeader';

const AdminDashboard = () => {
    // --- State Variables ---
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [allJobs, setAllJobs] = useState([]);
    const [stats, setStats] = useState({ totalStudents: 0, totalFaculty: 0, totalJobs: 0 });
    const [loading, setLoading] = useState(true);

    // Filter State
    const [userFilter, setUserFilter] = useState('All');

    // --- Fetch System Data ---
    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                setLoading(true);
                const [userRes, usersRes, jobsRes] = await Promise.allSettled([
                    API.get('/auth/me'),
                    API.get('/admin/users'),
                    API.get('/admin/jobs')
                ]);

                if (userRes.status === 'fulfilled') setUser(userRes.value.data);
                
                if (usersRes.status === 'fulfilled') {
                    const fetchedUsers = usersRes.value.data || [];
                    setUsers(fetchedUsers);
                    
                    // Compute stats
                    const students = fetchedUsers.filter(u => u.role === 'Student').length;
                    const faculty = fetchedUsers.filter(u => u.role === 'Faculty').length;
                    setStats(prev => ({ ...prev, totalStudents: students, totalFaculty: faculty }));
                }

                if (jobsRes.status === 'fulfilled') {
                    const fetchedJobs = jobsRes.value.data?.jobs || jobsRes.value.data || [];
                    setAllJobs(fetchedJobs);
                    setStats(prev => ({ ...prev, totalJobs: fetchedJobs.length }));
                }

            } catch (err) {
                console.error("Error loading admin data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    // --- Actions ---
    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this user from the system?")) return;

        try {
            await API.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => (u._id || u.id) !== userId));
            alert("User removed successfully.");
        } catch (err) {
            alert("Failed to delete user.");
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm("Delete this job listing?")) return;

        try {
            await API.delete(`/admin/jobs/${jobId}`);
            setAllJobs(allJobs.filter(j => (j._id || j.id) !== jobId));
            alert("Job listing removed.");
        } catch (err) {
            alert("Failed to remove job listing.");
        }
    };

    const filteredUsers = users.filter(u => {
        if (userFilter === 'All') return true;
        return u.role?.toLowerCase() === userFilter.toLowerCase();
    });

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading Administrative Dashboard...</div>;
    }

    return (
        <>
            <DashboardHeader user={user} roleName="Administrator" />
            <div style={styles.container}>
                {/* BANNER */}
                <div style={styles.banner}>
                    <span style={styles.badge}>• System Control Center</span>
                    <h1 style={styles.welcomeText}>Hello, Admin! 👋</h1>
                    <p style={styles.bannerSub}>Monitor platform metrics, manage registered user accounts, and maintain job board contents.</p>

                    {/* OVERVIEW STATS */}
                    <div style={styles.statsRow}>
                        <div style={styles.statCard}>
                            <span style={styles.statNumber}>{stats.totalStudents}</span>
                            <span style={styles.statLabel}>Students</span>
                        </div>
                        <div style={styles.statCard}>
                            <span style={styles.statNumber}>{stats.totalFaculty}</span>
                            <span style={styles.statLabel}>Faculty</span>
                        </div>
                        <div style={styles.statCard}>
                            <span style={styles.statNumber}>{stats.totalJobs}</span>
                            <span style={styles.statLabel}>Active Jobs</span>
                        </div>
                    </div>
                </div>

                {/* MAIN GRID */}
                <div style={styles.gridContainer}>
                    {/* LEFT COLUMN: USER MANAGEMENT */}
                    <div style={styles.leftCol}>
                        <div style={styles.sectionCard}>
                            <div style={styles.sectionHeader}>
                                <div>
                                    <h2 style={styles.sectionTitle}>👥 User Management</h2>
                                    <p style={styles.sectionSub}>Manage accounts across all system roles</p>
                                </div>
                                
                                {/* FILTER PILLS */}
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {['All', 'Student', 'Faculty', 'Admin'].map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setUserFilter(role)}
                                            style={{
                                                ...styles.roleFilterBtn,
                                                backgroundColor: userFilter === role ? '#4f46e5' : '#f1f5f9',
                                                color: userFilter === role ? '#ffffff' : '#475569'
                                            }}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* USERS TABLE */}
                            <div style={{ overflowX: 'auto' }}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr style={styles.tableHeader}>
                                            <th style={styles.th}>Name</th>
                                            <th style={styles.th}>Email</th>
                                            <th style={styles.th}>Role</th>
                                            <th style={styles.th}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                                                    No users found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((u) => (
                                                <tr key={u._id || u.id} style={styles.tr}>
                                                    <td style={styles.td}><strong>{u.name || u.fullName || 'User'}</strong></td>
                                                    <td style={styles.td}>{u.email}</td>
                                                    <td style={styles.td}>
                                                        <span style={{
                                                            ...styles.roleTag,
                                                            backgroundColor: u.role === 'Admin' ? '#fef2f2' : u.role === 'Faculty' ? '#f0fdf4' : '#eff6ff',
                                                            color: u.role === 'Admin' ? '#dc2626' : u.role === 'Faculty' ? '#166534' : '#1d4ed8'
                                                        }}>
                                                            {u.role || 'Student'}
                                                        </span>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <button 
                                                            onClick={() => handleDeleteUser(u._id || u.id)}
                                                            style={styles.deleteBtn}
                                                        >
                                                            Revoke Access
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: JOB MODERATION */}
                    <div style={styles.rightCol}>
                        <div style={styles.sectionCard}>
                            <h3 style={styles.sectionTitle}>⚙ Platform Job Audit</h3>
                            <p style={styles.sectionSub}>Review or remove active system listings</p>

                            <div style={{ marginTop: '16px' }}>
                                {allJobs.length === 0 ? (
                                    <p style={{ fontSize: '13px', color: '#64748b' }}>No system jobs found.</p>
                                ) : (
                                    allJobs.map((j) => (
                                        <div key={j._id || j.id} style={styles.auditCard}>
                                            <div>
                                                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{j.title}</strong>
                                                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>{j.location || 'Remote'}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteJob(j._id || j.id)}
                                                style={styles.smallDeleteBtn}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// --- STYLES ---
const styles = {
    container: { backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' },
    banner: { backgroundColor: '#4338ca', borderRadius: '16px', padding: '32px', color: '#ffffff' },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    welcomeText: { fontSize: '28px', fontWeight: '800', margin: '12px 0 6px 0' },
    bannerSub: { fontSize: '14px', color: '#e0e7ff', margin: 0 },
    statsRow: { display: 'flex', gap: '16px', marginTop: '24px' },
    statCard: { backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '16px 24px', borderRadius: '12px', minWidth: '110px' },
    statNumber: { display: 'block', fontSize: '22px', fontWeight: '800' },
    statLabel: { fontSize: '11px', color: '#e0e7ff' },
    gridContainer: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', marginTop: '24px' },
    leftCol: { display: 'flex', flexDirection: 'column' },
    rightCol: { display: 'flex', flexDirection: 'column' },
    sectionCard: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 },
    sectionSub: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    roleFilterBtn: { padding: '4px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '8px' },
    tableHeader: { borderBottom: '2px solid #e2e8f0' },
    th: { padding: '12px 8px', fontSize: '12px', fontWeight: '700', color: '#475569' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '12px 8px', fontSize: '13px', color: '#334155' },
    roleTag: { fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px' },
    deleteBtn: { backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
    auditCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px' },
    smallDeleteBtn: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }
};

export default AdminDashboard;