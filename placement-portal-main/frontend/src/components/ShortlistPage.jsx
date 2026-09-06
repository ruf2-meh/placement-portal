import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function ShortlistPage() {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [applicants, setApplicants] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMessage, setActionMessage] = useState('');

    useEffect(() => {
        fetchApplicants();
    }, [jobId]);

    const fetchApplicants = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/portal/jobs/${jobId}/applicants`);
            setApplicants(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error fetching job applicants", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((appId) => appId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const availableIds = applicants
            .filter((app) => app.status !== 'shortlisted')
            .map((app) => app.id);
            setSelectedIds(availableIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleBatchShortlist = async () => {
        if (selectedIds.length === 0) return;
        try {
            const res = await axios.post('http://localhost:5000/api/portal/applications/batch-shortlist', {
                application_ids: selectedIds
            });
            setActionMessage(res.data.message || `Successfully shortlisted ${selectedIds.length} candidate(s)!`);
            setSelectedIds([]);
            fetchApplicants();
        } catch (err) {
            alert("Batch shortlisting failed. Please check backend.");
        }
    };

    return (
        <div style={pageStyles.container}>
        {/* Top Navbar */}
        <nav style={pageStyles.navbar}>
        <div style={pageStyles.navLeft}>
        <div style={pageStyles.logoBadge}>🕒</div>
        <span style={pageStyles.logoText}>InternSphere</span>
        <div style={pageStyles.divider}>|</div>
        <span style={pageStyles.breadcrumbLink} onClick={() => navigate('/dashboard')} role="button" tabIndex={0}>Dashboard</span>
        <span style={pageStyles.breadcrumbArrow}>&gt;</span>
        <span style={pageStyles.breadcrumbActive}>Shortlist Applicants</span>
        </div>
        <button onClick={() => navigate('/dashboard')} style={pageStyles.backBtn}>
        ← Back to Dashboard
        </button>
        </nav>

        {/* Main Container */}
        <div style={pageStyles.contentWrapper}>
        <div style={pageStyles.card}>
        <div style={pageStyles.headerRow}>
        <div>
        <div style={pageStyles.badge}>Position ID: #{jobId}</div>
        <h2 style={pageStyles.title}>Candidate Applications</h2>
        <p style={pageStyles.subtitle}>Review submitted student applications and batch shortlist qualified candidates for interviews.</p>
        </div>
        <button
        onClick={handleBatchShortlist}
        disabled={selectedIds.length === 0}
        style={{
            ...pageStyles.shortlistActionBtn,
            backgroundColor: selectedIds.length === 0 ? '#cbd5e1' : '#2563eb',
            cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer'
        }}
        >
        Shortlist Selected ({selectedIds.length})
        </button>
        </div>

        {actionMessage && (
            <div style={pageStyles.successAlert}>
            ✅ {actionMessage}
            </div>
        )}

        {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
            Pulling applicants from database...
            </div>
        ) : applicants.length === 0 ? (
            <div style={pageStyles.emptyState}>
            <div style={pageStyles.emptyIcon}>👥</div>
            <h4 style={{ margin: '10px 0 4px 0', color: '#0f172a' }}>No Applications Yet</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Students have not submitted proposals for this listing yet.</p>
            </div>
        ) : (
            <div style={{ overflowX: 'auto' }}>
            <table style={pageStyles.table}>
            <thead>
            <tr style={pageStyles.tableHeadRow}>
            <th style={{ ...pageStyles.th, width: '40px' }}>
            <input type="checkbox" onChange={handleSelectAll} style={{ accentColor: '#2563eb', cursor: 'pointer' }} />
            </th>
            <th style={pageStyles.th}>Candidate</th>
            <th style={pageStyles.th}>Email Address</th>
            <th style={pageStyles.th}>Applied Date</th>
            <th style={pageStyles.th}>Current Status</th>
            </tr>
            </thead>
            <tbody>
            {applicants.map((app) => (
                <tr key={app.id} style={{ ...pageStyles.tableRow, backgroundColor: selectedIds.includes(app.id) ? '#f8fafc' : '#ffffff' }}>
                <td style={pageStyles.td}>
                <input
                type="checkbox"
                checked={selectedIds.includes(app.id)}
                onChange={() => handleToggleSelect(app.id)}
                disabled={app.status === 'shortlisted' || app.status === 'accepted'}
                style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                />
                </td>
                <td style={{ ...pageStyles.td, fontWeight: '600', color: '#0f172a' }}>
                {app.User?.name || `Student #${app.student_id}`}
                </td>
                <td style={{ ...pageStyles.td, color: '#64748b' }}>
                {app.User?.email || 'N/A'}
                </td>
                <td style={{ ...pageStyles.td, color: '#64748b' }}>
                {new Date(app.createdAt).toLocaleDateString()}
                </td>
                <td style={pageStyles.td}>
                <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor:
                    app.status === 'shortlisted' ? '#eff6ff' :
                    app.status === 'accepted' ? '#ecfdf5' : '#fef9c3',
                    color:
                    app.status === 'shortlisted' ? '#2563eb' :
                    app.status === 'accepted' ? '#166534' : '#b45309'
                }}>
                {app.status || 'applied'}
                </span>
                </td>
                </tr>
            ))}
            </tbody>
            </table>
            </div>
        )}
        </div>
        </div>
        </div>
    );
}

const pageStyles = {
    container: { minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '14px 40px', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
    navLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    logoBadge: { backgroundColor: '#2563eb', color: '#fff', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' },
    logoText: { fontSize: '18px', fontWeight: '700', color: '#0f172a' },
    divider: { color: '#cbd5e1', margin: '0 4px' },
    breadcrumbLink: { fontSize: '14px', color: '#64748b', cursor: 'pointer' },
    breadcrumbArrow: { fontSize: '12px', color: '#94a3b8' },
    breadcrumbActive: { fontSize: '14px', color: '#2563eb', fontWeight: '600' },
    backBtn: { padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#334155' },
    contentWrapper: { maxWidth: '1100px', margin: '30px auto', padding: '0 20px' },
    card: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    badge: { display: 'inline-block', backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', marginBottom: '8px' },
    title: { fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' },
    subtitle: { fontSize: '14px', color: '#64748b', margin: 0, maxWidth: '650px', lineHeight: '1.4' },
    shortlistActionBtn: { color: 'white', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', boxShadow: '0 4px 12px rgba(37,99,235,0.15)', transition: 'background 0.2s' },
    successAlert: { padding: '12px 16px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '500' },
    emptyState: { textAlign: 'center', padding: '50px 20px', border: '1px dashed #e2e8f0', borderRadius: '14px', backgroundColor: '#f8fafc' },
    emptyIcon: { fontSize: '32px', color: '#94a3b8' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' },
    tableHeadRow: { borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' },
    th: { padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
    tableRow: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '16px', fontSize: '14px' }
};
