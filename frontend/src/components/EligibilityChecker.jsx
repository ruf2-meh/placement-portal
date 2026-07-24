import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EligibilityChecker({ jobId, studentId }) {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkEligibility = async () => {
      try {
        setLoading(true);
        // 1. FIXED: Matches portal.js route (/eligibility/:jobId/:studentId)
        const res = await axios.get(
          `http://localhost:5000/api/portal/eligibility/${jobId}/${studentId}`
        );
        if (isMounted) {
          setEligibility(res.data);
        }
      } catch (err) {
        console.error("Eligibility Check Error:", err);
        if (isMounted) {
          setEligibility({
            eligible: false,
            matchPercentage: 0,
            matchedSkills: [],
            missingSkills: [],
            reasons: ['Unable to reach eligibility service.']
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (jobId && studentId) {
      checkEligibility();
    } else {
      setLoading(false);
    }

    return () => { isMounted = false; };
  }, [jobId, studentId]);

  if (loading) {
    return <span style={{ fontSize: '12px', color: '#64748b' }}>⏳ Checking eligibility...</span>;
  }

  if (!eligibility) return null;

  // 2. FIXED: Map backend properties correctly
  const isEligible = eligibility.eligible ?? false;
  const matchPercentage = eligibility.matchPercentage ?? 0;
  const reasons = eligibility.reasons || [];
  const statusLabel = isEligible ? 'Eligible' : 'Not Eligible';

  return (
    <div style={styles.cardContainer}>
      <div style={styles.topRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              ...styles.badge,
              backgroundColor: isEligible ? '#dcfce7' : '#fee2e2',
              color: isEligible ? '#15803d' : '#b91c1c'
            }}
          >
            {isEligible ? '✅ ' : '⚠️ '} {statusLabel}
          </span>
          <span style={styles.matchScore}>{matchPercentage}% Skill Match</span>
        </div>
      </div>

      {/* Missing Skills Box */}
      {eligibility.missingSkills && eligibility.missingSkills.length > 0 && (
        <div style={styles.missingBox}>
          <span style={{ fontWeight: '600', fontSize: '11px', color: '#991b1b' }}>
            Missing Skills:
          </span>{' '}
          <span style={{ fontSize: '11px', color: '#7f1d1d' }}>
            {eligibility.missingSkills.join(', ')}
          </span>
        </div>
      )}

      {/* Reasons / Checks Summary */}
      {reasons.length > 0 && (
        <div style={styles.reasonsBox}>
          {reasons.map((reason, idx) => (
            <div key={idx} style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
              • {reason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  cardContainer: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 12px',
    marginTop: '8px'
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  matchScore: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155'
  },
  missingBox: {
    marginTop: '6px',
    padding: '4px 8px',
    backgroundColor: '#fef2f2',
    borderRadius: '4px',
    border: '1px solid #fecaca'
  },
  reasonsBox: {
    marginTop: '6px',
    paddingTop: '4px',
    borderTop: '1px border-dashed #e2e8f0'
  }
};