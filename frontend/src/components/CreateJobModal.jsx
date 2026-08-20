import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const CreateJobModal = ({ isOpen, onClose, onJobCreated }) => {
    // --- State Variables ---
    const [companies, setCompanies] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        companyId: '',
        location: '',
        type: 'Full-time',
        requirements: '',
        description: '',
        deadline: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch existing companies for dropdown selection
    useEffect(() => {
        if (isOpen) {
            const fetchCompanies = async () => {
                try {
                    const res = await API.get('/companies');
                    setCompanies(res.data || []);
                } catch (err) {
                    console.error("Failed to load companies list:", err);
                }
            };
            fetchCompanies();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- Form Submit Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.companyId || !formData.description) {
            return alert("Please fill in all required fields (Title, Company, and Description).");
        }

        try {
            setSubmitting(true);
            const res = await API.post('/jobs', formData);
            alert("Job posted successfully under selected company!");
            
            if (onJobCreated) onJobCreated(res.data);
            
            // Reset form and close
            setFormData({
                title: '',
                companyId: '',
                location: '',
                type: 'Full-time',
                requirements: '',
                description: '',
                deadline: ''
            });
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create job.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modalCard}>
                <div style={styles.modalHeader}>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>🏢 Create Job for Company</h2>
                    <button onClick={onClose} style={styles.closeBtn}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
                    {/* COMPANY SELECTION DROPDOWN */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Select Company *</label>
                        <select
                            value={formData.companyId}
                            onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                            style={styles.input}
                            required
                        >
                            <option value="">-- Choose a Registered Company --</option>
                            {companies.map((comp) => (
                                <option key={comp._id || comp.id} value={comp._id || comp.id}>
                                    {comp.name || comp.companyName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* JOB TITLE & LOCATION */}
                    <div style={styles.formRow}>
                        <div style={{ flex: 1 }}>
                            <label style={styles.label}>Job Title *</label>
                            <input
                                type="text"
                                placeholder="e.g. Backend Developer"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                style={styles.input}
                                required
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={styles.label}>Location</label>
                            <input
                                type="text"
                                placeholder="e.g. New York / Remote"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                style={styles.input}
                            />
                        </div>
                    </div>

                    {/* EMPLOYMENT TYPE & DEADLINE */}
                    <div style={styles.formRow}>
                        <div style={{ flex: 1 }}>
                            <label style={styles.label}>Job Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                style={styles.input}
                            >
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Internship">Internship</option>
                                <option value="Remote">Remote</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={styles.label}>Application Deadline</label>
                            <input
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                style={styles.input}
                            />
                        </div>
                    </div>

                    {/* REQUIRED SKILLS */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Required Skills (Comma separated)</label>
                        <input
                            type="text"
                            placeholder="e.g. React, PHP, MySQL, Docker"
                            value={formData.requirements}
                            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                            style={styles.input}
                        />
                    </div>

                    {/* DESCRIPTION */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Job Description *</label>
                        <textarea
                            rows="4"
                            placeholder="Provide details about key responsibilities..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={styles.textarea}
                            required
                        />
                    </div>

                    {/* ACTION BUTTONS */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                        <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                        <button type="submit" disabled={submitting} style={styles.submitBtn}>
                            {submitting ? 'Posting...' : 'Post Job'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- STYLES ---
const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalCard: { backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '560px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' },
    closeBtn: { border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer', color: '#64748b' },
    formGroup: { marginTop: '12px' },
    formRow: { display: 'flex', gap: '12px', marginTop: '12px' },
    label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
    cancelBtn: { padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: '600', cursor: 'pointer' },
    submitBtn: { padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }
};

export default CreateJobModal;