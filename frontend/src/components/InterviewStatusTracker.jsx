import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const statusStyle = (status) => {
    const base = { padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' };
    switch (status) {
        case 'scheduled': return { ...base, backgroundColor: '#dbeafe', color: '#1d4ed8' };
        case 'completed': return { ...base, backgroundColor: '#dcfce7', color: '#15803d' };
        case 'cancelled': return { ...base, backgroundColor: '#fee2e2', color: '#b91c1c' };
        case 'rescheduled': return { ...base, backgroundColor: '#fef3c7', color: '#b45309' };
        default: return base;
    }
};

// role="company" -> table view (Student | Job | Interview Date | Status)
// role="student" -> card view (Job, Status, Date, Time), read-only
//
// Reuses the exact same endpoints built in Phase 7
// (GET /interviews/company, GET /interviews/student) — no new backend
// work needed for this feature, since status is already tracked there.
const InterviewStatusTracker = ({ role }) => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const endpoint = role === 'company' ? '/interviews/company' : '/interviews/student';
        API.get(endpoint)
            .then((res) => setInterviews(res.data || []))
            .catch((err) => console.error('Failed to load interview statuses:', err))
            .finally(() => setLoading(false));
    }, [role]);

    if (loading) {
        return <div style={styles.card}><p style={styles.subtext}>Loading interview status...</p></div>;
    }

    if (role === 'company') {
        return (
            <div style={styles.card}>
                <h2 style={styles.heading}>📋 Interview Status Tracker</h2>
                {interviews.length === 0 ? (
                    <p style={styles.subtext}>No interviews scheduled yet.</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Student</th>
                                <th style={styles.th}>Job</th>
                                <th style={styles.th}>Interview Date</th>
                                <th style={styles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {interviews.map((iv) => (
                                <tr key={iv._id}>
                                    <td style={styles.td}>{iv.student?.name || 'Unknown'}</td>
                                    <td style={styles.td}>{iv.job?.title || 'N/A'}</td>
                                    <td style={styles.td}>
                                        {new Date(iv.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td style={styles.td}><span style={statusStyle(iv.status)}>{iv.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        );
    }

    // Student view
    return (
        <div style={styles.card}>
            <h2 style={styles.heading}>📋 Interview Status</h2>
            {interviews.length === 0 ? (
                <p style={styles.subtext}>No interviews scheduled yet.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {interviews.map((iv) => {
                        const d = new Date(iv.scheduledAt);
                        return (
                            <div key={iv._id} style={styles.statusCard}>
                                <div style={styles.statusRow}>
                                    <div>
                                        <div style={styles.jobTitle}>{iv.job?.title || 'Job'}</div>
                                        <div style={styles.subtext}>{iv.company?.name || 'Company'}</div>
                                    </div>
                                    <span style={statusStyle(iv.status)}>{iv.status}</span>
                                </div>
                                <div style={styles.subtext}>
                                    📅 {d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} &nbsp;•&nbsp; 🕐 {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </div>
                                {iv.meetingLink && (
                                    <div style={{ fontSize: '13px', marginTop: '4px' }}>🔗 <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer">{iv.meetingLink}</a></div>
                                )}
                                {iv.location && (
                                    <div style={{ fontSize: '13px', marginTop: '4px' }}>📍 {iv.location}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const styles = {
    card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px' },
    heading: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 14px 0' },
    subtext: { fontSize: '13px', color: '#64748b' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', padding: '8px', borderBottom: '2px solid #e2e8f0' },
    td: { padding: '10px 8px', fontSize: '13px', color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
    statusCard: { border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' },
    statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
    jobTitle: { fontSize: '14px', fontWeight: '700', color: '#0f172a' }
};

export default InterviewStatusTracker;