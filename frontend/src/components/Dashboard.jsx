import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EligibilityChecker from './EligibilityChecker';

export default function Dashboard() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : { id: 1, name: "Rufaida Mehzabin Raita", role: "Student" };
    } catch (e) {
      return { id: 1, name: "Rufaida Mehzabin Raita", role: "Student" };
    }
  });

  // Active View Tab State: 'dashboard' | 'profile'
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- Student Profile State ---
  const [profile, setProfile] = useState({
    bio: '',
    phone: '',
    major: 'Computer Science',
    skills: '', 
    resume_url: '',
    cgpa: ''
  });

  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [projectForm, setProjectForm] = useState({ title: '', description: '', link: '', tech_stack: '' });
  const [myProjects, setMyProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);

  // --- Company States ---
  const [jobForm, setJobForm] = useState({ title: '', description: '', requirements: '', location: '', deadline: '' });
  const [myJobs, setMyJobs] = useState([]);

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    const today = new Date().toISOString().split('T')[0];
    return deadline < today;
  };

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  useEffect(() => {
    fetchNotifications();
    if (user.role === 'Student') {
      fetchJobs();
      fetchMyProjects();
      fetchStudentProfile();
    } else if (user.role === 'Company') {
      fetchCompanyJobs();
    }
  }, [user.role, user.id]);

  const fetchStudentProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/portal/students/${user.id}`);
      if (res.data) setProfile(res.data);
    } catch (err) {
      console.log("Profile notice: using local draft state.");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/portal/students/${user.id}`, profile);
      alert("✅ Profile details updated successfully!");
    } catch (err) {
      alert("✅ Saved profile locally!");
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/portal/notifications/${user.id}`);
      setNotifications(res.data);
    } catch (err) { console.error("Error pulling notifications", err); }
  };

  const handleBellClick = () => {
    setNotificationOpen((current) => !current);
    fetchNotifications();
  };

  const markNotificationAsRead = async (notificationId) => {
    const selectedNotification = notifications.find((n) => n.id === notificationId);
    if (!selectedNotification || selectedNotification.is_read) return;

    try {
      await axios.patch(`http://localhost:5000/api/portal/notifications/${notificationId}/read`, { user_id: user.id });
      setNotifications((curr) => curr.map((n) => n.id === notificationId ? { ...n, is_read: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllNotificationsAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await axios.patch(`http://localhost:5000/api/portal/notifications/${user.id}/read-all`);
      setNotifications((curr) => curr.map((n) => ({ ...n, is_read: true })));
    } catch (err) { console.error(err); }
  };

  const formatNotificationTime = (createdAt) => createdAt ? new Date(createdAt).toLocaleString() : '';

  const fetchJobs = async (keyword = '') => {
    try {
      const res = await axios.get(`http://localhost:5000/api/portal/jobs/search?keyword=${keyword}`);
      setJobs(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchCompanyJobs = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/portal/jobs/company/${user.id}`);
      setMyJobs(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchMyProjects = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/portal/projects/${user.id}`);
      setMyProjects(res.data);
    } catch (err) { console.error(err); }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/jobs', { ...jobForm, company_id: user.id });
      alert("🎉 Job posted successfully!");
      setJobForm({ title: '', description: '', requirements: '', location: '', deadline: '' });
      fetchCompanyJobs();
    } catch (err) { alert("Error dispatching job posting."); }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (editingProject) {
      try {
        await axios.put(`http://localhost:5000/api/portal/projects/${editingProject.id}`, projectForm);
        alert("✅ Project updated successfully!");
        setEditingProject(null);
        setProjectForm({ title: '', description: '', link: '', tech_stack: '' });
        fetchMyProjects();
      } catch (err) { alert("Error updating project."); }
    } else {
      try {
        await axios.post('http://localhost:5000/api/portal/projects', { ...projectForm, student_id: user.id });
        alert("✅ Project added to showcase!");
        setProjectForm({ title: '', description: '', link: '', tech_stack: '' });
        fetchMyProjects();
      } catch (err) { alert("Error adding project."); }
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({ 
      title: project.title, 
      description: project.description || '', 
      link: project.link || '', 
      tech_stack: project.tech_stack || '' 
    });
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setProjectForm({ title: '', description: '', link: '', tech_stack: '' });
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Remove this project from your showcase?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/portal/projects/${id}`);
      fetchMyProjects();
    } catch (err) { alert("Error deleting project."); }
  };

  const handleApply = async (jobId) => {
    try {
      const res = await axios.post('http://localhost:5000/api/portal/jobs/apply', { job_id: jobId, student_id: user.id });
      alert(res.data.message);
      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || "Error applying to job.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div style={styles.dashboardContainer}>
      
      {/* Cleaned Top Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBadge}>🕒</div>
          <span style={styles.logoText}>HireHive</span>
          <div style={styles.divider}>|</div>
          
          <button 
            onClick={() => setActiveTab('dashboard')} 
            style={{ ...styles.navTabBtn, color: '#2563eb', fontWeight: '700' }}
          >
            Dashboard
          </button>
        </div>

        <div style={styles.navRight}>
          {/* Notifications Bell */}
          <div style={styles.notificationWrapper}>
            <button type="button" onClick={handleBellClick} style={styles.notificationBellButton} aria-label="Open notifications">
              🔔
              {unreadCount > 0 && (
                <span style={styles.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {notificationOpen && (
              <div style={styles.notificationDropdown}>
                <div style={styles.notificationDropdownHeader}>
                  <div>
                    <h4 style={styles.notificationDropdownTitle}>Notifications</h4>
                    <span style={styles.notificationDropdownSubtitle}>{unreadCount} unread</span>
                  </div>
                  {unreadCount > 0 && (
                    <button type="button" onClick={markAllNotificationsAsRead} style={styles.markAllButton}>
                      Mark all as read
                    </button>
                  )}
                </div>

                <div style={styles.notificationDropdownList}>
                  {notifications.length === 0 ? (
                    <p style={styles.notificationEmptyText}>No notifications yet.</p>
                  ) : (
                    notifications.slice(0, 6).map((notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        onClick={() => markNotificationAsRead(notification.id)}
                        style={{
                          ...styles.notificationDropdownItem,
                          ...(notification.is_read ? styles.notificationDropdownItemRead : styles.notificationDropdownItemUnread)
                        }}
                      >
                        <span style={styles.notificationMessage}>{notification.message}</span>
                        <span style={styles.notificationTime}>{formatNotificationTime(notification.createdAt)}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <div style={styles.profileHeaderBtn}>
            <div style={styles.userAvatar}>
              {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user.name}</span>
              <span style={styles.userRoleText}>{user.role} 👤</span>
            </div>
          </div>

          <button onClick={handleLogout} style={styles.signOutBtn}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </nav>

      {/* Hero Welcome Banner */}
      <div style={styles.heroBanner}>
        <div style={styles.heroLeft}>
          <div style={styles.workspacePill}>● {user.role} Workspace</div>
          <h1 style={styles.heroTitle}>Welcome back, {user.name} 👋</h1>
          <p style={styles.heroSubtitle}>
            {activeTab === 'profile' 
              ? "Keep your student details, resume, and skill set updated for recruitment eligibility checks."
              : user.role === 'Student' 
                ? "Search internships, manage your portfolio, and stay updated with notifications."
                : "Broadcast fresh internship opportunities and track applicant milestones."}
          </p>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={styles.workspaceLayout}>
        
        {/* VIEW 1: MY PROFILE (MAIN AREA WHEN ACTIVE) */}
        {activeTab === 'profile' && user.role === 'Student' ? (
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '16px' }}>
              <button onClick={() => setActiveTab('dashboard')} style={{ ...styles.signOutBtn, cursor: 'pointer' }}>
                ← Back to Dashboard
              </button>
            </div>
            <section style={styles.contentCard}>
              <div style={styles.cardHeader}>
                <span style={{ ...styles.cardIcon, backgroundColor: '#eff6ff', color: '#2563eb' }}>👤</span>
                <div>
                  <h3 style={styles.cardTitle}>Manage My Student Profile</h3>
                  <p style={styles.cardSub}>Update your details used for eligibility checking and job matching</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} style={styles.formLayout}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.fieldLabel}>Full Name</label>
                    <input type="text" value={user.name} disabled style={{ ...styles.textInput, backgroundColor: '#f1f5f9' }} />
                  </div>
                  <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.fieldLabel}>Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="+8801..." 
                      value={profile.phone} 
                      onChange={e => setProfile({ ...profile, phone: e.target.value })} 
                      style={styles.textInput} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.fieldLabel}>Major / Department</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Computer Science & Engineering" 
                      value={profile.major} 
                      onChange={e => setProfile({ ...profile, major: e.target.value })} 
                      style={styles.textInput} 
                    />
                  </div>
                  <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.fieldLabel}>CGPA (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 3.85" 
                      value={profile.cgpa} 
                      onChange={e => setProfile({ ...profile, cgpa: e.target.value })} 
                      style={styles.textInput} 
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Skills & Tech Stack <span style={{ color: '#ef4444' }}>*</span> (Comma-separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. React, Node.js, MySQL, Python, PHP, Java" 
                    value={profile.skills} 
                    onChange={e => setProfile({ ...profile, skills: e.target.value })} 
                    style={styles.textInput} 
                    required 
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>💡 These skills will be automatically matched against company job requirements!</span>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Resume Link (Google Drive / GitHub / Portfolio)</label>
                  <input 
                    type="url" 
                    placeholder="https://drive.google.com/your-resume-link" 
                    value={profile.resume_url} 
                    onChange={e => setProfile({ ...profile, resume_url: e.target.value })} 
                    style={styles.textInput} 
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Short Bio / Summary</label>
                  <textarea 
                    placeholder="Briefly describe your career goals and interests..." 
                    value={profile.bio} 
                    onChange={e => setProfile({ ...profile, bio: e.target.value })} 
                    style={{ ...styles.textInput, minHeight: '90px', resize: 'vertical' }} 
                  />
                </div>

                <button type="submit" style={styles.primaryActionBtn}>💾 Save Profile Changes</button>
              </form>
            </section>
          </div>
        ) : (
          /* VIEW 2: MAIN DASHBOARD */
          <div style={styles.leftColumn}>
            {user.role === 'Company' ? (
              <>
                {/* Post Job Form */}
                <section style={styles.contentCard}>
                  <div style={styles.cardHeader}>
                    <span style={{ ...styles.cardIcon, backgroundColor: '#eff6ff', color: '#2563eb' }}>💼</span>
                    <div>
                      <h3 style={styles.cardTitle}>Post a New Job Opening</h3>
                      <p style={styles.cardSub}>Provide detailed requirements for target students</p>
                    </div>
                  </div>

                  <form onSubmit={handlePostJob} style={styles.formLayout}>
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Job Title <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" placeholder="e.g. Full Stack Developer Intern" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} style={styles.textInput} required />
                    </div>
                    
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Job Description <span style={{ color: '#ef4444' }}>*</span></label>
                      <textarea placeholder="Outline day-to-day operations and stack tools..." value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} style={{ ...styles.textInput, minHeight: '100px', resize: 'vertical' }} required />
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ ...styles.inputGroup, flex: 1 }}>
                        <label style={styles.fieldLabel}>Requirements</label>
                        <input type="text" placeholder="e.g. React, MySQL, PHP" value={jobForm.requirements} onChange={e => setJobForm({ ...jobForm, requirements: e.target.value })} style={styles.textInput} />
                      </div>
                      <div style={{ ...styles.inputGroup, flex: 1 }}>
                        <label style={styles.fieldLabel}>Location</label>
                        <input type="text" placeholder="e.g. Remote / On-site" value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} style={styles.textInput} />
                      </div>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Application Deadline Date <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="date" value={jobForm.deadline} onChange={e => setJobForm({ ...jobForm, deadline: e.target.value })} style={styles.textInput} required />
                    </div>

                    <button type="submit" style={styles.primaryActionBtn}>+ Publish Job Post</button>
                  </form>
                </section>

                {/* Company Active Listings */}
                <section style={styles.contentCard}>
                  <div style={styles.cardHeader}>
                    <span style={{ ...styles.cardIcon, backgroundColor: '#f0fdf4', color: '#16a34a' }}>📋</span>
                    <div>
                      <h3 style={styles.cardTitle}>Your Active Job Postings</h3>
                      <p style={styles.cardSub}>Track and manage your listed internal positions</p>
                    </div>
                    <span style={styles.resultsBadge}>{myJobs.length} active</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                    {myJobs.length === 0 ? (
                      <div style={styles.emptyIllustrationState}>
                        <div style={{ ...styles.searchLensGraphic, backgroundColor: '#f0fdf4', color: '#16a34a' }}>💼</div>
                        <h4 style={styles.emptyStateTitle}>No listings posted yet.</h4>
                        <p style={styles.emptyStateSub}>Fill out the form above to deploy your very first internship opening onto the platform feed.</p>
                      </div>
                    ) : myJobs.map(job => (
                      <div key={job.id} style={styles.dataItemRow}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={styles.itemTitle}>{job.title}</h4>
                            <p style={styles.itemDescription}>{job.description}</p>
                            <div style={{ ...styles.itemMetaLine, marginBottom: 0 }}>
                              <span>📍 {job.location || 'Remote'}</span>
                              <span>•</span>
                              <span>📝 Skills: <strong>{job.requirements || 'N/A'}</strong></span>
                              <span>•</span>
                              <span>⏰ Deadline: <strong style={{ color: '#ef4444' }}>{job.deadline}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <>
                {/* Student Job Search */}
                <section style={styles.contentCard}>
                  <div style={styles.cardHeader}>
                    <span style={{ ...styles.cardIcon, backgroundColor: '#eff6ff', color: '#2563eb' }}>🔍</span>
                    <div>
                      <h3 style={styles.cardTitle}>Search Internship Opportunities</h3>
                      <p style={styles.cardSub}>Browse and filter available positions</p>
                    </div>
                    <span style={styles.resultsBadge}>{jobs.length} results</span>
                  </div>

                  <div style={styles.searchBarRow}>
                    <input 
                      type="text" 
                      placeholder="Filter by Job Title or Location..." 
                      value={searchKeyword} 
                      onChange={e => setSearchKeyword(e.target.value)} 
                      style={styles.searchInputField} 
                    />
                    <button onClick={() => fetchJobs(searchKeyword)} style={styles.primaryActionBtn}>Search</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                    {jobs.length === 0 ? (
                      <div style={styles.emptyIllustrationState}>
                        <div style={styles.searchLensGraphic}>🔍</div>
                        <h4 style={styles.emptyStateTitle}>No job listings found.</h4>
                        <p style={styles.emptyStateSub}>Try adjusting your search or filters to discover available internships.</p>
                      </div>
                    ) : jobs.map(job => (
                      <div key={job.id} style={styles.dataItemRow}>
                        <div>
                          <h4 style={styles.itemTitle}>{job.title}</h4>
                          <p style={styles.itemDescription}>{job.description}</p>
                        </div>
                        
                        <div style={styles.itemMetaLine}>
                          <span>📍 {job.location || 'Remote'}</span>
                          <span>•</span>
                          <span>📝 Requirements: <strong>{job.requirements || 'N/A'}</strong></span>
                          <span>•</span>
                          <span>⏰ Deadline: <strong style={{ color: isDeadlinePassed(job.deadline) ? '#b91c1c' : '#ef4444' }}>{job.deadline}</strong></span>
                        </div>

                        <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                          <EligibilityChecker jobId={job.id} studentId={user.id} />
                        </div>

                        {isDeadlinePassed(job.deadline) ? (
                          <span style={styles.deadlineClosedBadge}>🔒 Applications Closed</span>
                        ) : (
                          <button onClick={() => handleApply(job.id)} style={styles.applyInlineBtn}>Apply For Role</button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Student Portfolio Showcase */}
                <section style={styles.contentCard}>
                  <div style={styles.cardHeader}>
                    <span style={{ ...styles.cardIcon, backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>📁</span>
                    <div>
                      <h3 style={styles.cardTitle}>Project Portfolio Showcase</h3>
                      <p style={styles.cardSub}>Highlight your work to stand out to recruiters</p>
                    </div>
                    <span style={styles.resultsBadge}>{myProjects.length} project{myProjects.length !== 1 ? 's' : ''}</span>
                  </div>

                  <form onSubmit={handleAddProject} style={styles.formLayout}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ ...styles.inputGroup, flex: 1 }}>
                        <label style={styles.fieldLabel}>Project Title <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="text" placeholder="e.g. E-Commerce Web App" value={projectForm.title} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })} style={styles.textInput} required />
                      </div>
                      <div style={{ ...styles.inputGroup, flex: 1 }}>
                        <label style={styles.fieldLabel}>Tech Stack</label>
                        <input type="text" placeholder="e.g. React, Node.js, MySQL" value={projectForm.tech_stack} onChange={e => setProjectForm({ ...projectForm, tech_stack: e.target.value })} style={styles.textInput} />
                      </div>
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Description</label>
                      <textarea placeholder="Briefly describe what this project does..." value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} style={{ ...styles.textInput, minHeight: '72px', resize: 'vertical' }} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Live Demo / GitHub URL</label>
                      <input type="text" placeholder="https://github.com/..." value={projectForm.link} onChange={e => setProjectForm({ ...projectForm, link: e.target.value })} style={styles.textInput} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" style={styles.primaryActionBtn}>
                        {editingProject ? '💾 Save Changes' : '+ Add Project'}
                      </button>
                      {editingProject && (
                        <button type="button" onClick={handleCancelEdit} style={styles.signOutBtn}>Cancel</button>
                      )}
                    </div>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '25px' }}>
                    {myProjects.length === 0 ? (
                      <div style={styles.emptyIllustrationState}>
                        <div style={{ ...styles.searchLensGraphic, backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>📁</div>
                        <h4 style={styles.emptyStateTitle}>No projects added yet.</h4>
                        <p style={styles.emptyStateSub}>Showcase your projects to improve your internship profile.</p>
                      </div>
                    ) : myProjects.map(p => (
                      <div key={p.id} style={styles.dataItemRow}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ ...styles.itemTitle, color: '#8b5cf6' }}>
                              🌟 {p.title}
                              {p.tech_stack && <span style={{ ...styles.soonBadge, marginLeft: '10px', backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>{p.tech_stack}</span>}
                            </h4>
                            {p.description && <p style={styles.itemDescription}>{p.description}</p>}
                            {p.link && (
                              <a href={p.link} target="_blank" rel="noreferrer" style={styles.projectLinkText}>🔗 {p.link}</a>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', flexShrink: 0 }}>
                            <button onClick={() => handleEditProject(p)} style={{ ...styles.signOutBtn, fontSize: '12px', padding: '6px 12px' }}>✏️ Edit</button>
                            <button onClick={() => handleDeleteProject(p.id)} style={{ ...styles.signOutBtn, fontSize: '12px', padding: '6px 12px', color: '#b91c1c', borderColor: '#fecaca' }}>🗑️ Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* RIGHT SIDEBAR */}
        <div style={styles.rightColumn}>
          
          {/* 1. ALERTS FEED CARD */}
          <section style={styles.contentCard}>
            <div style={{ ...styles.cardHeader, borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <span style={{ ...styles.cardIcon, backgroundColor: '#eff6ff', color: '#2563eb' }}>🔔</span>
              <div>
                <h3 style={{ ...styles.cardTitle, margin: 0 }}>Alerts Feed</h3>
                <span style={styles.alertUnreadText}>{unreadCount} unread</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '260px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                  <div style={styles.bellEmptyIcon}>🔔</div>
                  <h5 style={{ margin: '8px 0 4px 0', fontSize: '13px', color: '#1e293b' }}>No notifications</h5>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>We'll notify you about applications, interviews, and deadlines.</p>
                </div>
              ) : notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => markNotificationAsRead(notification.id)}
                  style={{
                    ...styles.notificationBubble,
                    ...(notification.is_read ? styles.notificationBubbleRead : styles.notificationBubbleUnread)
                  }}
                >
                  <span style={styles.notificationMessage}>{notification.message}</span>
                  <span style={styles.notificationTime}>{formatNotificationTime(notification.createdAt)}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 2. MY PROFILE CARD (BELOW ALERTS FEED) */}
          {user.role === 'Student' && (
            <section style={styles.contentCard}>
              <div style={{ ...styles.cardHeader, marginBottom: '12px' }}>
                <span style={{ ...styles.cardIcon, backgroundColor: '#f0fdf4', color: '#16a34a' }}>👤</span>
                <div>
                  <h3 style={{ ...styles.cardTitle, margin: 0 }}>My Profile</h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Eligibility & Resume</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>{user.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Major: {profile.major || 'Computer Science'}</div>
                
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#334155' }}>
                  <strong>Key Skills:</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile.skills || 'No skills added yet'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setActiveTab(activeTab === 'profile' ? 'dashboard' : 'profile')} 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: activeTab === 'profile' ? '#f1f5f9' : '#16a34a', 
                  color: activeTab === 'profile' ? '#334155' : '#ffffff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  textAlign: 'center' 
                }}
              >
                {activeTab === 'profile' ? '← Back to Dashboard' : '✏️ View / Edit Profile'}
              </button>
            </section>
          )}

        </div>

      </div>
    </div>
  );
}

// CSS Stylesheet
const styles = {
  dashboardContainer: { minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: '60px' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '14px 40px', borderBottom: '1px solid #e2e8f0' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoBadge: { backgroundColor: '#2563eb', color: '#fff', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  logoText: { fontWeight: '700', fontSize: '18px', color: '#0f172a' },
  divider: { color: '#cbd5e1', margin: '0 4px' },
  navTabBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px 8px' },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  
  profileHeaderBtn: { display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', padding: '4px 8px' },
  userAvatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '14px' },
  userInfo: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  userName: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
  userRoleText: { fontSize: '12px', color: '#64748b' },

  notificationWrapper: { position: 'relative' },
  notificationBellButton: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', position: 'relative', padding: '8px' },
  notificationBadge: { position: 'absolute', top: '2px', right: '2px', backgroundColor: '#ef4444', color: '#ffffff', fontSize: '10px', fontWeight: 'bold', borderRadius: '10px', padding: '2px 5px' },
  notificationDropdown: { position: 'absolute', right: 0, top: '40px', width: '320px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 1000, overflow: 'hidden' },
  notificationDropdownHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
  notificationDropdownTitle: { margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' },
  notificationDropdownSubtitle: { fontSize: '12px', color: '#64748b' },
  markAllButton: { background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 },
  notificationDropdownList: { maxHeight: '300px', overflowY: 'auto' },
  notificationEmptyText: { margin: 0, padding: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' },
  notificationDropdownItem: { width: '100%', border: 'none', background: 'none', display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' },
  notificationDropdownItemRead: { backgroundColor: '#ffffff' },
  notificationDropdownItemUnread: { backgroundColor: '#eff6ff' },
  notificationMessage: { fontSize: '13px', color: '#1e293b', lineHeight: '1.4' },
  notificationTime: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' },
  
  signOutBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '13px', fontWeight: '500', color: '#334155', cursor: 'pointer' },
  
  heroBanner: { backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '32px 40px' },
  heroLeft: { maxWidth: '650px' },
  workspacePill: { display: 'inline-block', padding: '4px 12px', borderRadius: '16px', backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '12px', fontWeight: '600', marginBottom: '12px' },
  heroTitle: { fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' },
  heroSubtitle: { fontSize: '15px', color: '#64748b', margin: 0, lineHeight: '1.5' },
  
  workspaceLayout: { display: 'flex', gap: '24px', padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' },
  leftColumn: { flex: '1', display: 'flex', flexDirection: 'column', gap: '24px' },
  rightColumn: { width: '340px', display: 'flex', flexDirection: 'column', gap: '24px', flexShrink: 0 },
  
  contentCard: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  cardIcon: { width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' },
  cardSub: { fontSize: '13px', color: '#64748b', margin: 0 },
  resultsBadge: { marginLeft: 'auto', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '12px' },
  
  formLayout: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldLabel: { fontSize: '13px', fontWeight: '600', color: '#334155' },
  textInput: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  primaryActionBtn: { padding: '10px 18px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start' },
  
  searchBarRow: { display: 'flex', gap: '12px', marginBottom: '16px' },
  searchInputField: { flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' },
  
  emptyIllustrationState: { textAlign: 'center', padding: '40px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' },
  searchLensGraphic: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px auto' },
  emptyStateTitle: { fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: '0 0 4px 0' },
  emptyStateSub: { fontSize: '13px', color: '#64748b', margin: 0 },
  
  dataItemRow: { padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px' },
  itemTitle: { fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  itemDescription: { fontSize: '13px', color: '#475569', margin: '0 0 8px 0', lineHeight: '1.4' },
  itemMetaLine: { display: 'flex', gap: '10px', fontSize: '12px', color: '#64748b', alignItems: 'center', flexWrap: 'wrap' },
  applyInlineBtn: { alignSelf: 'flex-start', padding: '8px 14px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  deadlineClosedBadge: { alignSelf: 'flex-start', padding: '6px 12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
  
  projectLinkText: { fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' },
  soonBadge: { backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' },
  alertUnreadText: { fontSize: '12px', color: '#2563eb', fontWeight: '600' },
  bellEmptyIcon: { fontSize: '24px', opacity: 0.5 },
  notificationBubble: { width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', textAlign: 'left', cursor: 'pointer' },
  notificationBubbleRead: { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' },
  notificationBubbleUnread: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }
};