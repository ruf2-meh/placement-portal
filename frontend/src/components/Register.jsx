import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Student' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (role) => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            // This safely forwards all criteria including the updated role variable state cleanly to backend route maps
            await axios.post('http://localhost:5000/api/auth/register', formData);
            setSuccess('🎉 Account registered successfully! Forwarding to gate...');
            setTimeout(() => { navigate('/login'); }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration pipeline validation error.');
        }
    };

    return (
        <div style={styles.container}>
            {/* Left Column matching premium design upgrade banner exactly */}
            <div style={styles.leftPanel}>
                <div style={styles.logoTopLeft}>
                    <div style={styles.logoBadge}>🕒</div>
                    <span style={styles.logoText}>InternSphere</span>
                </div>
                
                <div style={styles.heroContent}>
                    {/* Recreating the floating multi-card node artwork seen in the onboarding layout view */}
                    <div style={styles.artFrame}>
                        <div style={styles.centerNode}>I</div>
                        <div style={{...styles.satNode, top: '10px', left: '10px'}}>👤<br/><span style={{fontSize:'7px'}}>Student</span></div>
                        <div style={{...styles.satNode, top: '10px', right: '10px'}}>📄<br/><span style={{fontSize:'7px'}}>CV Upload</span></div>
                        <div style={{...styles.satNode, bottom: '10px', left: '10px'}}>✅<br/><span style={{fontSize:'7px'}}>Verified</span></div>
                        <div style={{...styles.satNode, bottom: '10px', right: '10px'}}>📊<br/><span style={{fontSize:'7px'}}>Metrics</span></div>
                    </div>
                    <h1 style={styles.heroTitle}>Launch Your Internship Journey</h1>
                    <p style={styles.heroSubtitle}>Connect students, companies, and faculty through one intelligent internship management platform.</p>
                </div>

                <div style={styles.statsRow}>
                    <div style={styles.statBox}><strong>2,400+</strong><span style={styles.statLabel}>Students Placed</span></div>
                    <div style={styles.statBox}><strong>380+</strong><span style={styles.statLabel}>Partner Companies</span></div>
                    <div style={styles.statBox}><strong>94%</strong><span style={styles.statLabel}>Placement Rate</span></div>
                </div>
            </div>

            {/* Right Column Registration Form Deck */}
            <div style={styles.rightPanel}>
                <div style={styles.formCard}>
                    <div style={styles.formHeaderBrand}>
                        <div style={{...styles.logoBadge, backgroundColor:'#2563eb'}}>🕒</div>
                        <span style={{fontSize:'15px', fontWeight:'700', color:'#0f172a'}}>InternSphere</span>
                    </div>

                    <h2 style={styles.welcomeText}>Create Account</h2>
                    <p style={styles.subWelcome}>Sign up below to access your dedicated workspace ecosystem.</p>

                    {error && <div style={styles.errorAlert}>⚠️ {error}</div>}
                    {success && <div style={styles.successAlert}>✅ {success}</div>}

                    <label style={styles.inputLabelUpper}>SIGN UP AS</label>
                    <div style={styles.roleTabsRow}>
                        {['Student', 'Company', 'Faculty', 'Admin'].map((role) => {
                            const isActive = formData.role === role;
                            // Adding explicit inline icons matching layout definitions
                            const icons = { Student: '🎓', Company: '🏢', Faculty: '🧑‍🏫', Admin: '⚙️' };
                            return (
                                <button key={role} type="button" onClick={() => handleRoleChange(role)} style={{...styles.roleTabButton, ...(isActive ? styles.roleTabActive : {})}}>
                                    <span style={{fontSize: '13px', marginBottom:'2px'}}>{icons[role]}</span>
                                    <span style={{fontSize: '11px', fontWeight: isActive ? '600' : '400'}}>{role}</span>
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSubmit} style={styles.formElement}>
                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabelUpper}>FULL NAME / CORPORATION NAME</label>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}>👤</span>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Acme Corp or Jane Doe" swimming-role={formData.role} required style={styles.textInput} />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabelUpper}>EMAIL ADDRESS</label>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}>✉️</span>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@university.edu" required style={styles.textInput} />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabelUpper}>PASSWORD</label>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}>🔒</span>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create your password" required style={styles.textInput} />
                            </div>
                        </div>

                        <button type="submit" style={styles.submitBtn}>Sign Up</button>
                    </form>

                    <p style={styles.footerRedirect}>
                        Already have an account? <Link to="/login" style={styles.redirectLink}>Register</Link>
                    </p>
                    
                    <div style={styles.subCopyright}>© 2026 InternSphere. All rights reserved.</div>
                </div>
            </div>
        </div>
    );
};

// Layout specification dictionary config mirroring structural constraints seamlessly
const styles = {
    container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    leftPanel: { flex: 1, background: 'linear-gradient(135deg, #1e40af 0%, #0284c7 60%, #0d9488 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '45px', color: '#fff', position: 'relative' },
    logoTopLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
    logoBadge: { backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', width: '26px', height: '26px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' },
    logoText: { fontSize: '16px', fontWeight: '700', letterSpacing: '-0.3px' },
    heroContent: { maxWidth: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', margin: 'auto' },
    
    artFrame: { width: '220px', height: '220px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px', position: 'relative', border: '1px dashed rgba(255,255,255,0.2)' },
    centerNode: { width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px', boxShadow: '0 0 20px rgba(255,255,255,0.2)' },
    satNode: { position: 'absolute', backgroundColor: '#fff', color: '#0f172a', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', textAlign:'center', minWidth:'50px' },

    heroTitle: { fontSize: '28px', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.5px', color:'#ffffff' },
    heroSubtitle: { fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.5' },
    statsRow: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '20px' },
    statBox: { textAlign: 'center', flex: 1, color:'#ffffff' },
    statLabel: { display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop:'2px' },
    
    rightPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: '#ffffff' },
    formCard: { width: '100%', maxWidth: '380px' },
    formHeaderBrand: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px' },
    welcomeText: { fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
    subWelcome: { fontSize: '14px', color: '#64748b', margin: '0 0 24px 0' },
    errorAlert: { padding: '12px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #fca5a5' },
    successAlert: { padding: '12px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #bbf7d0' },
    
    roleTabsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '4px', backgroundColor: '#f1f5f9', borderRadius: '10px', marginBottom: '24px' },
    roleTabButton: { padding: '8px 0', border: 'none', background: 'none', borderRadius: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.15s' },
    roleTabActive: { backgroundColor: '#ffffff', color: '#2563eb', boxShadow: '0 4px 10px rgba(0,0,0,0.04)' },
    
    formElement: { display: 'flex', flexDirection: 'column', gap: '16px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    inputLabelUpper: { fontSize: '11px', fontWeight: '600', color: '#475569', letterSpacing: '0.5px' },
    inputWrapper: { display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 14px', transition: 'all 0.2s' },
    inputIcon: { fontSize: '14px', color: '#94a3b8', marginRight: '10px' },
    textInput: { width: '100%', padding: '12px 0', border: 'none', outline: 'none', fontSize: '14px', color: '#1e293b', backgroundColor:'transparent' },
    submitBtn: { width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: '10px', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' },
    footerRedirect: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' },
    redirectLink: { color: '#2563eb', textDecoration: 'none', fontWeight: '600', marginLeft: '4px' },
    subCopyright: { textAlign: 'center', marginTop: '40px', fontSize: '11px', color: '#94a3b8' }
};

export default Register;