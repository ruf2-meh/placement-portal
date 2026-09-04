import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const YourCompatibilityWidget = ({ jobId }) => {
    const [matchData, setMatchData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!jobId) return;

        const fetchMatchScore = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await API.get(`/jobs/${jobId}/match`);
                if (response.data && response.data.success !== false) {
                    setMatchData(response.data);
                }
            } catch (err) {
                console.warn('Skill match fetch failed:', err);
                setError('Unable to calculate match score at this time.');
            } finally {
                setLoading(false);
            }
        };

        fetchMatchScore();
    }, [jobId]);

    if (loading) {
        return <div style={styles.card}><p style={styles.subtext}>Calculating your skill compatibility...</p></div>;
    }

    if (error || !matchData) {
        return null; // Graceful fallback; doesn't break the rest of the job detail view
    }

    const { matchPercentage, matchedSkills, missingSkills, requiredSkillCount } = matchData;

    // Dynamic color indicator based on score
    const getBadgeColor = (score) => {
        if (score >= 75) return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
        if (score >= 40) return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
        return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
    };

    const badgeStyle = getBadgeColor(matchPercentage);

    return (
        <div style={styles.card}>
            <div style={styles.headerRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>⚡</span>
                    <h3 style={styles.heading}>Your Compatibility</h3>
                </div>
                <div style={{ ...styles.scoreBadge, backgroundColor: badgeStyle.bg, color: badgeStyle.text, borderColor: badgeStyle.border }}>
                    {matchPercentage}% Match
                </div>
            </div>

            <div style={styles.statsSummary}>
                <span>Required Skills: <strong>{requiredSkillCount}</strong></span>
                <span>•</span>
                <span>Your Matching Skills: <strong>{matchedSkills.length}</strong></span>
            </div>

            <div style={styles.skillsContainer}>
                {/* Matched Skills */}
                {matchedSkills.map((skill, idx) => (
                    <span key={`match-${idx}`} style={styles.matchedTag}>
                        ✓ {skill}
                    </span>
                ))}

                {/* Missing Skills */}
                {missingSkills.map((skill, idx) => (
                    <span key={`missing-${idx}`} style={styles.missingTag}>
                        ✗ {skill}
                    </span>
                ))}
            </div>
        </div>
    );
};

const styles = {
    card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    heading: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 },
    scoreBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '700', border: '1px solid' },
    statsSummary: { fontSize: '12px', color: '#64748b', display: 'flex', gap: '8px', marginBottom: '14px' },
    skillsContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    matchedTag: { backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
    missingTag: { backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' },
    subtext: { fontSize: '13px', color: '#64748b', margin: 0 }
};

export default YourCompatibilityWidget;