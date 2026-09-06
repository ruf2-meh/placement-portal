import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [selectedRole, setSelectedRole] = useState('Student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Dynamic stats state initialized with zeros
    const [stats, setStats] = useState({
        studentsPlaced: '0',
        partnerCompanies: '0',
        placementRate: '0%'
    });

    // Fetch dynamic stats from backend
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/portal/stats');
                if (res.data) {
                    setStats({
                        studentsPlaced: res.data.studentsPlaced || '0',
                        partnerCompanies: res.data.partnerCompanies || '0',
                        placementRate: res.data.placementRate || '0%'
                    });
                }
            } catch (err) {
                console.warn('Could not load dynamic stats from server, defaulting to 0.');
            }
        };

        fetchStats();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                ...formData,
                role: selectedRole
            });
            
            // Extract role from backend response or fallback to selected tab
            const userRole = (res.data.user?.role || selectedRole).toLowerCase();

            // Store authentication details and role in localStorage
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', userRole);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            // Dynamic client-side routing based on specific user role
            navigate(`/${userRole}-dashboard`);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Left Decorative Panel */}
            <div style={styles.leftPanel}>
                <div style={styles.logoTopLeft}>🕒 HireHive</div>
                <div style={styles.heroContent}>
                    <div style={styles.illustrationPlaceholder}>
                        <div style={styles.circleGraphic}>I</div>
                    </div>
                    <h1 style={styles.heroTitle}>Launch Your Internship<br />Journey</h1>
                    <p style={styles.heroSubtitle}>Connect students, companies, and faculty through one intelligent internship management platform.</p>
                </div>
                
                <div style={styles.statsRow}>
                    <div><strong>{stats.studentsPlaced}</strong><br/><span style={styles.statLabel}>Students Placed</span></div>
                    <div><strong>{stats.partnerCompanies}</strong><br/><span style={styles.statLabel}>Partner Companies</span></div>
                    <div><strong>{stats.placementRate}</strong><br/><span style={styles.statLabel}>Placement Rate</span></div>
                </div>
            </div>

            {/* Right Interactive Form Panel */}
            <div style={styles.rightPanel}>
                <div style={styles.formCard}>
                    <h2 style={styles.welcomeText}>Welcome Back</h2>
                    <p style={styles.subWelcome}>Sign in to continue to your dashboard.</p>

                    {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

                    {/* Role Tabs */}
                    <label style={styles.inputLabel}>SIGN IN AS</label>
                    <div style={styles.roleTabsRow}>
                        {['Student', 'Company', 'Faculty', 'Admin'].map((role) => {
                            const icons = { Student: '🎓', Company: '🏢', Faculty: '🧑‍🏫', Admin: '⚙️' };
                            const isActive = selectedRole === role;
                            return (
                                <button 
                                    key={role} 
                                    type="button" 
                                    onClick={() => setSelectedRole(role)} 
                                    style={{...styles.roleTabButton, ...(isActive ? styles.roleTabActive : {})}}
                                >
                                    <span style={{ fontSize: '14px', marginBottom: '2px' }}>{icons[role]}</span>
                                    <span>{role}</span>
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSubmit} style={styles.formElement}>
                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabel}>Email Address</label>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}>✉️</span>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    placeholder="you@university.edu" 
                                    required 
                                    style={styles.textInput} 
                                />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={styles.inputLabel}>Password</label>
                                <Link to="/forgot-password" style={styles.forgotLink}>Forgot Password?</Link>
                            </div>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}>🔒</span>
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    placeholder="Enter your password" 
                                    required 
                                    style={styles.textInput} 
                                />
                            </div>
                        </div>

                        <div style={styles.rememberRow}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#666' }}>
                                <input type="checkbox" style={{ cursor: 'pointer' }} /> Remember me for 30 days
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={styles.dividerRow}><span>OR</span></div>
                    
                    <button type="button" style={styles.googleBtn}>
                        <span style={{ marginRight: '8px' }}>🌐</span> Continue with Google
                    </button>

                    <p style={styles.footerRedirect}>
                        Don't have an account? <Link to="/register" style={styles.redirectLink}>Register</Link>
                    </p>

                    <div style={styles.copyrightText}>© 2026 HireHive. All rights reserved.</div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', minHeight: '100vh', backgroundColor: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    leftPanel: { flex: 1.1, background: 'linear-gradient(135deg, #1e40af 0%, #0369a1 50%, #0d9488 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px', color: '#fff', position: 'relative' },
    logoTopLeft: { fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' },
    heroContent: { maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' },
    illustrationPlaceholder: { width: '260px', height: '260px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' },
    circleGraphic: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '24px', boxShadow: '0 0 20px rgba(37,99,235,0.5)' },
    heroTitle: { fontSize: '32px', fontWeight: 'bold', lineHeight: '1.2', marginBottom: '16px' },
    heroSubtitle: { fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' },
    statsRow: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '25px', fontSize: '18px' },
    statLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.7)' },
    
    rightPanel: { flex: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: '#f8fafc' },
    formCard: { width: '100%', maxWidth: '420px' },

    welcomeText: { fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' },
    subWelcome: { fontSize: '14px', color: '#64748b', marginBottom: '24px' },
    errorAlert: { padding: '12px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '6px', fontSize: '14px', marginBottom: '15px', border: '1px solid #fca5a5' },
    roleTabsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '4px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '20px' },
    roleTabButton: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0', border: 'none', background: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#64748b', transition: 'all 0.2s' },
    roleTabActive: { backgroundColor: '#fff', color: '#1e293b', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' },
    formElement: { display: 'flex', flexDirection: 'column', gap: '16px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    inputLabel: { fontSize: '12px', fontWeight: '600', color: '#475569', letterSpacing: '0.3px', textTransform: 'uppercase' },
    inputWrapper: { display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', transition: 'border-color 0.2s' },
    inputIcon: { fontSize: '14px', color: '#94a3b8', marginRight: '10px' },
    textInput: { width: '100%', padding: '12px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '14px', color: '#334155' },
    forgotLink: { fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' },
    rememberRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' },
    submitBtn: { width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', marginTop: '8px', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' },
    dividerRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', margin: '20px 0' },
    googleBtn: { width: '100%', padding: '12px', backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500' },
    footerRedirect: { textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' },
    redirectLink: { color: '#2563eb', textDecoration: 'none', fontWeight: '600' },
    copyrightText: { textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '30px' }
};

export default Login;