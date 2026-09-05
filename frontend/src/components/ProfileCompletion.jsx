import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const ProfileCompletion = ({ userId, onProfileSaved }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        department: 'CSE',
        cgpa: '',
        backlogs: '0',
        skills: '',
        bio: ''
    });

    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    // Fetch existing profile if available
    useEffect(() => {
        if (!userId) return;

        const fetchProfile = async () => {
            try {
                const res = await API.get(`/profile/${userId}`);
                if (res.data) {
                    setFormData({
                        full_name: res.data.full_name || '',
                        phone: res.data.phone || '',
                        department: res.data.department || 'CSE',
                        cgpa: res.data.cgpa !== null ? res.data.cgpa : '',
                        backlogs: res.data.backlogs !== null ? res.data.backlogs : '0',
                        skills: res.data.skills || '',
                        bio: res.data.bio || ''
                    });
                }
            } catch (err) {
                // If 404, student hasn't created a profile yet - silent handle
            }
        };
        fetchProfile();
    }, [userId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            setStatusMsg({ type: 'error', text: 'Could not identify your account. Please log in again.' });
            return;
        }
        setLoading(true);
        setStatusMsg({ type: '', text: '' });

        try {
            const res = await API.post('/profile', {
                ...formData,
                user_id: userId
            });

            setStatusMsg({ type: 'success', text: res.data.message });
            
            // Notify parent component so eligibility checker & navigation badges update instantly
            if (onProfileSaved) {
                onProfileSaved();
            }
        } catch (err) {
            setStatusMsg({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to update profile.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <h2 style={{ marginBottom: '8px', color: '#1a1a1a' }}>👤 Profile Completion</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Keep your profile updated to match job eligibility criteria.</p>

            {statusMsg.text && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    backgroundColor: statusMsg.type === 'success' ? '#e6f4ea' : '#fce8e6',
                    color: statusMsg.type === 'success' ? '#137333' : '#c5221f',
                    fontWeight: '500'
                }}>
                    {statusMsg.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Full Name</label>
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} required />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Department</label>
                        <select name="department" value={formData.department} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                            <option value="CSE">CSE</option>
                            <option value="ECE">ECE</option>
                            <option value="EEE">EEE</option>
                            <option value="MECH">MECH</option>
                            <option value="CIVIL">CIVIL</option>
                            <option value="IT">IT</option>
                        </select>
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Phone Number</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>CGPA (0.00 - 10.00)</label>
                        <input type="number" step="0.01" name="cgpa" value={formData.cgpa} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} required />
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Active Backlogs</label>
                        <input type="number" name="backlogs" value={formData.backlogs} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} required />
                    </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Key Skills (comma separated)</label>
                    <input type="text" name="skills" value={formData.skills} placeholder="e.g. React, Node.js, Python, SQL" onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Short Bio</label>
                    <textarea name="bio" rows="3" value={formData.bio} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}></textarea>
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {loading ? 'Saving...' : 'Save & Update Profile'}
                </button>
            </form>
        </div>
    );
};

export default ProfileCompletion;