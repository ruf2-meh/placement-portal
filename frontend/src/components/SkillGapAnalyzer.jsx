import React, { useState, useEffect } from 'react';
import API from '../api/axios';

// Deliberately reuses the exact same GET /jobs/:id/match endpoint that
// YourCompatibilityWidget.jsx uses. Feature 3 (Skill Gap Analyzer) and
// Feature 2 (Skill Matcher) must always agree with each other — the
// safest way to guarantee that is for them to be two different views of
// the literal same computation, rather than two separate implementations
// that could drift apart.
const SkillGapAnalyzer = ({ jobId }) => {
    const [matchData, setMatchData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!jobId) return;

        const fetchGapAnalysis = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await API.get(`/jobs/${jobId}/match`);
                if (response.data && response.data.success !== false) {
                    setMatchData(response.data);
                }
            } catch (err) {
                console.warn('Skill gap analysis fetch failed:', err);
                setError('Unable to analyze skill gap at this time.');
            } finally {
                setLoading(false);
            }
        };

        fetchGapAnalysis();
    }, [jobId]);

    if (loading) {
        return <div style={styles.card}><p style={styles.subtext}>Analyzing your skill gap...</p></div>;
    }

    if (error || !matchData) {
        return null; // Graceful fallback; doesn't break the rest of the job detail view
    }

    const { matchPercentage, matchedSkills, missingSkills, requiredSkillCount, studentSkillCount } = matchData;

    // Empty states, per spec
    if (requiredSkillCount === 0) {
        return (
            <div style={styles.card}>
                <h3 style={styles.heading}>📊 Skill Gap Analysis</h3>
                <p style={styles.emptyState}>This job does not specify required skills.</p>
            </div>
        );
    }

    if (studentSkillCount === 0) {
        return (
            <div style={styles.card}>
                <h3 style={styles.heading}>📊 Skill Gap Analysis</h3>
                <p style={styles.emptyState}>Add skills to your profile to see your skill gap.</p>
            </div>
        );
    }

    return (
        <div style={styles.card}>
            <div style={styles.headerRow}>
                <h3 style={styles.heading}>📊 Skill Gap Analysis</h3>
                <div style={styles.scoreBadge}>{matchPercentage}% Compatibility</div>
            </div>

            {missingSkills.length === 0 ? (
                <p style={styles.successMessage}>✅ You have all the required skills for this job.</p>
            ) : (
                <p style={styles.gapMessage}>
                    You are missing {missingSkills.length} required skill{missingSkills.length === 1 ? '' : 's'}.
                </p>
            )}

            <div style={styles.section}>
                <p style={styles.sectionLabel}>Skills You Have</p>
                <div style={styles.skillsContainer}>
                    {matchedSkills.length === 0 ? (
                        <span style={styles.subtext}>None of the required skills yet.</span>
                    ) : (
                        matchedSkills.map((skill, idx) => (
                            <span key={`have-${idx}`} style={styles.matchedTag}>✓ {skill}</span>
                        ))
                    )}
                </div>
            </div>

            {missingSkills.length > 0 && (
                <div style={styles.section}>
                    <p style={styles.sectionLabel}>Skills You're Missing</p>
                    <div style={styles.skillsContainer}>
                        {missingSkills.map((skill, idx) => (
                            <span key={`missing-${idx}`} style={styles.missingTag}>✗ {skill}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    heading: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 },
    scoreBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
    successMessage: { fontSize: '13px', color: '#15803d', fontWeight: '600', marginBottom: '14px' },
    gapMessage: { fontSize: '13px', color: '#b91c1c', fontWeight: '600', marginBottom: '14px' },
    emptyState: { fontSize: '13px', color: '#64748b', margin: 0 },
    section: { marginBottom: '12px' },
    sectionLabel: { fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.02em' },
    skillsContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    matchedTag: { backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
    missingTag: { backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' },
    subtext: { fontSize: '13px', color: '#64748b', margin: 0 }
};

export default SkillGapAnalyzer;