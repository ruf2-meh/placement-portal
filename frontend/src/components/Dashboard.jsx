import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user')) || { id: 1, name: "Rufaida Mehzabin", role: "Student" };
  
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [projectForm, setProjectForm] = useState({ title: '', description: '', link: '', tech_stack: '' });
  const [myProjects, setMyProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null); // null = add mode, object = edit mode

  // --- Company States ---
  const [jobForm, setJobForm] = useState({ title: '', description: '', requirements: '', location: '', deadline: '' });
  const [myJobs, setMyJobs] = useState([]);


 
  // --- Feature 6: Deadline helper ---
  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    const today = new Date().toISOString().split('T')[0];
    return deadline < today;
  };

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
 

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;


  useEffect(() => {
    fetchNotifications();
    if (user.role === 'Student') {
      fetchJobs();
      fetchMyProjects();
    } else if (user.role === 'Company') {
      fetchCompanyJobs();
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/portal/notifications/${user.id}`);
      setNotifications(res.data);
    } catch (err) {
      console.error("Error pulling notifications", err);
    }
  };

  const handleBellClick = () => {
    setNotificationOpen((current) => !current);
    fetchNotifications();
  };

  const markNotificationAsRead = async (notificationId) => {
    const selectedNotification = notifications.find(
      (notification) => notification.id === notificationId
    );

    if (!selectedNotification || selectedNotification.is_read) {
      return;
    }

    try {
      await axios.patch(
        `http://localhost:5000/api/portal/notifications/${notificationId}/read`,
        { user_id: user.id }
      );

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Error marking notification as read", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await axios.patch(
        `http://localhost:5000/api/portal/notifications/${user.id}/read-all`
      );

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          is_read: true
        }))
      );
    } catch (err) {
      console.error("Error marking all notifications as read", err);
    }
  };

  const formatNotificationTime = (createdAt) => {
    if (!createdAt) {
      return '';
    }

    return new Date(createdAt).toLocaleString();
  };

  const fetchJobs = async (keyword = '') => {
    try {
      const res = await axios.get(`http://localhost:5000/api/portal/jobs/search?keyword=${keyword}`);
      setJobs(res.data);
    } catch (err) { console.error("Error pulling job board metrics"); }
  };

  const fetchCompanyJobs = async () => {
    try {
      // Fetch jobs specifically filtered by this company's ID
      const res = await axios.get(`http://localhost:5000/api/portal/jobs/company/${user.id}`);
      setMyJobs(res.data);
    } catch (err) { console.error("Error pulling company job list"); }
  };

  const fetchMyProjects = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/portal/projects/${user.id}`);
      setMyProjects(res.data);
    } catch (err) { console.error("Error pulling student showcase"); }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/jobs', { ...jobForm, company_id: user.id });
      alert("🎉 Job posted successfully into backend system!");
      setJobForm({ title: '', description: '', requirements: '', location: '', deadline: '' });
      fetchNotifications();
      fetchCompanyJobs(); // Instantly refresh the company list on completion
    } catch (err) { alert("Error dispatching job posting details."); }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (editingProject) {
      // Edit mode — call PUT
      try {
        await axios.put(`http://localhost:5000/api/portal/projects/${editingProject.id}`, projectForm);
        alert("✅ Project updated successfully!");
        setEditingProject(null);
        setProjectForm({ title: '', description: '', link: '', tech_stack: '' });
        fetchMyProjects();
      } catch (err) { alert("Error updating project."); }
    } else {
      // Add mode — call POST
      try {
        await axios.post('http://localhost:5000/api/portal/projects', { ...projectForm, student_id: user.id });
        alert("✅ Project showcase linked to your profile!");
        setProjectForm({ title: '', description: '', link: '', tech_stack: '' });
        fetchMyProjects();
      } catch (err) { alert("Error adding showcase record."); }
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({ title: project.title, description: project.description || '', link: project.link || '', tech_stack: project.tech_stack || '' });
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
      alert(err.response?.data?.message || "Application process runtime error occurred.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div style={styles.dashboardContainer}>
      
      {/* Top Professional Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBadge}>🕒</div>
          <span style={styles.logoText}>HireHive</span>
          <div style={styles.divider}>|</div>
          <span style={styles.breadcrumbLink}>Dashboard</span>
          <span style={styles.breadcrumbArrow}>&gt;</span>
          <span style={styles.breadcrumbActive}>{user.role}</span>
        </div>
        <div style={styles.navRight}>
          <div style={styles.notificationWrapper}>
            <button
              type="button"
              onClick={handleBellClick}
              style={styles.notificationBellButton}
              aria-label="Open notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span style={styles.notificationBadge}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div style={styles.notificationDropdown}>
                <div style={styles.notificationDropdownHeader}>
                  <div>
                    <h4 style={styles.notificationDropdownTitle}>Notifications</h4>
                    <span style={styles.notificationDropdownSubtitle}>
                      {unreadCount} unread
                    </span>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      style={styles.markAllButton}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div style={styles.notificationDropdownList}>
                  {notifications.length === 0 ? (
                    <p style={styles.notificationEmptyText}>
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.slice(0, 6).map((notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        onClick={() => markNotificationAsRead(notification.id)}
                        style={{
                          ...styles.notificationDropdownItem,
                          ...(notification.is_read
                            ? styles.notificationDropdownItemRead
                            : styles.notificationDropdownItemUnread)
                        }}
                      >
                        <span style={styles.notificationMessage}>
                          {notification.message}
                        </span>
                        <span style={styles.notificationTime}>
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div style={styles.userAvatar}>{user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}</div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.name}</span>
            <span style={styles.userRoleText}>{user.role}</span>
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
            {user.role === 'Student' 
              ? "Search internships, manage your portfolio, and stay updated with important notifications."
              : "Broadcast fresh internship opportunities, review applicant project history, and track team hiring milestones."}
          </p>
          
          <div style={styles.metricsRow}>
            <div style={styles.metricCard}>
              <span style={styles.metricValue}>{user.role === 'Student' ? jobs.length : myJobs.length}</span>
              <span style={styles.metricLabel}>{user.role === 'Student' ? 'Applications' : 'Active Posts'}</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricValue}>0</span>
              <span style={styles.metricLabel}>Saved Jobs</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricValue}>—</span>
              <span style={styles.metricLabel}>Profile Score</span>
            </div>
          </div>
        </div>
        <div style={styles.heroIllustration}>
          <div style={styles.graphicWindow}>
            <div style={styles.graphicLines}></div>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Split Workspace */}
      <div style={styles.workspaceLayout}>
        
        {/* Left Side Active System Utilities */}
        <div style={styles.leftColumn}>
          {user.role === 'Company' ? (
            <>
              {/* Form Component */}
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
                    <label style={styles.fieldLabel}>Job Title <span style={{color: '#ef4444'}}>*</span></label>
                    <input type="text" placeholder="e.g. Full Stack Developer Intern" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} style={styles.textInput} required />
                  </div>
                  
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Job Description <span style={{color: '#ef4444'}}>*</span></label>
                    <textarea placeholder="Outline day-to-day operations and stack tools..." value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} style={{...styles.textInput, minHeight: '100px', resize: 'vertical'}} required />
                  </div>

                  <div style={{display: 'flex', gap: '16px'}}>
                    <div style={{...styles.inputGroup, flex: 1}}>
                      <label style={styles.fieldLabel}>Requirements</label>
                      <input type="text" placeholder="e.g. React, MySQL, PHP" value={jobForm.requirements} onChange={e => setJobForm({...jobForm, requirements: e.target.value})} style={styles.textInput} />
                    </div>
                    <div style={{...styles.inputGroup, flex: 1}}>
                      <label style={styles.fieldLabel}>Location</label>
                      <input type="text" placeholder="e.g. Remote / On-site" value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} style={styles.textInput} />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Application Deadline Date <span style={{color: '#ef4444'}}>*</span></label>
                    <input type="date" value={jobForm.deadline} onChange={e => setJobForm({...jobForm, deadline: e.target.value})} style={styles.textInput} required />
                  </div>

                  <button type="submit" style={styles.primaryActionBtn}>+ Publish Job Post</button>
                </form>
              </section>

              {/* Company Job Openings Management Component */}
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
                      <div style={{...styles.searchLensGraphic, backgroundColor: '#f0fdf4', color: '#16a34a'}}>💼</div>
                      <h4 style={styles.emptyStateTitle}>No listings posted yet.</h4>
                      <p style={styles.emptyStateSub}>Fill out the form above to deploy your very first internship opening onto the platform feed.</p>
                    </div>
                  ) : myJobs.map(job => (
                    <div key={job.id} style={styles.dataItemRow}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                          <h4 style={styles.itemTitle}>{job.title}</h4>
                          <p style={styles.itemDescription}>{job.description}</p>
                          <div style={{...styles.itemMetaLine, marginBottom: 0}}>
                            <span>📍 {job.location || 'Remote'}</span>
                            <span>•</span>
                            <span>📝 Skills: <strong>{job.requirements || 'N/A'}</strong></span>
                            <span>•</span>
                            <span>⏰ Deadline: <strong style={{ color: '#ef4444' }}>{job.deadline}</strong></span>
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontWeight: '600' }}>
                          Live Feed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              {/* Student Search Operations Block */}
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
                  <span style={styles.searchInnerIcon}>🔍</span>
                  <input type="text" placeholder="Filter by Job Title or Location..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} style={styles.searchInputField} />
                  <button onClick={() => fetchJobs(searchKeyword)} style={styles.primaryActionBtn}>Search</button>
                </div>

                {/* Aesthetic Filter Chips */}
                <div style={styles.filterChipsRow}>
                  {['Remote', 'On-site', 'Hybrid', 'Paid', 'Unpaid'].map(chip => (
                    <span key={chip} style={styles.chipPill}>{chip}</span>
                  ))}
                </div>

                {/* Opportunity Grid Output Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                  {jobs.length === 0 ? (
                    <div style={styles.emptyIllustrationState}>
                      <div style={styles.searchLensGraphic}>🔍<span style={{fontSize:'14px', position:'absolute', bottom:'10px', right:'10px'}}>?</span></div>
                      <h4 style={styles.emptyStateTitle}>No job listings found.</h4>
                      <p style={styles.emptyStateSub}>Try adjusting your search or filters to discover available internships.</p>
                    </div>
                  ) : jobs.map(job => (
                    <div key={job.id} style={styles.dataItemRow}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div>
                          <h4 style={styles.itemTitle}>{job.title}</h4>
                          <p style={styles.itemDescription}>{job.description}</p>
                        </div>
                      </div>
                      <div style={styles.itemMetaLine}>
                        <span>📍 {job.location || 'Remote'}</span>
                        <span>•</span>
                        <span>📝 Requirements: <strong>{job.requirements || 'N/A'}</strong></span>
                        <span>•</span>
                        <span>⏰ Deadline: <strong style={{ color: isDeadlinePassed(job.deadline) ? '#b91c1c' : '#ef4444' }}>{job.deadline}</strong></span>
                      </div>
                      {/* Feature 6: Show Apply button only when deadline has not passed */}
                      {isDeadlinePassed(job.deadline) ? (
                        <span style={styles.deadlineClosedBadge}>🔒 Applications Closed</span>
                      ) : (
                        <button onClick={() => handleApply(job.id)} style={styles.applyInlineBtn}>Apply For Role</button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Student Project Submission Showcasing Layout — Feature 9 */}
              <section style={styles.contentCard}>
                <div style={styles.cardHeader}>
                  <span style={{ ...styles.cardIcon, backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>📁</span>
                  <div>
                    <h3 style={styles.cardTitle}>Project Portfolio Showcase</h3>
                    <p style={styles.cardSub}>Highlight your work to stand out to recruiters</p>
                  </div>
                  <span style={styles.resultsBadge}>{myProjects.length} project{myProjects.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Add / Edit Form */}
                <form onSubmit={handleAddProject} style={styles.formLayout}>
                  <div style={{display: 'flex', gap: '16px'}}>
                    <div style={{...styles.inputGroup, flex: 1}}>
                      <label style={styles.fieldLabel}>Project Title <span style={{color:'#ef4444'}}>*</span></label>
                      <input type="text" placeholder="e.g. E-Commerce Web App" value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} style={styles.textInput} required />
                    </div>
                    <div style={{...styles.inputGroup, flex: 1}}>
                      <label style={styles.fieldLabel}>Tech Stack</label>
                      <input type="text" placeholder="e.g. React, Node.js, MySQL" value={projectForm.tech_stack} onChange={e => setProjectForm({...projectForm, tech_stack: e.target.value})} style={styles.textInput} />
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Description</label>
                    <textarea placeholder="Briefly describe what this project does..." value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} style={{...styles.textInput, minHeight: '72px', resize: 'vertical'}} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Live Demo / GitHub URL</label>
                    <input type="text" placeholder="https://github.com/..." value={projectForm.link} onChange={e => setProjectForm({...projectForm, link: e.target.value})} style={styles.textInput} />
                  </div>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button type="submit" style={styles.primaryActionBtn}>
                      {editingProject ? '💾 Save Changes' : '+ Add Project'}
                    </button>
                    {editingProject && (
                      <button type="button" onClick={handleCancelEdit} style={styles.signOutBtn}>Cancel</button>
                    )}
                  </div>
                </form>

                {/* Project List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '25px' }}>
                  {myProjects.length === 0 ? (
                    <div style={styles.emptyIllustrationState}>
                      <div style={{...styles.searchLensGraphic, backgroundColor: '#f5f3ff', color: '#8b5cf6'}}>📁<span style={{fontSize:'12px', position:'absolute', top:0, right:0}}>➕</span></div>
                      <h4 style={styles.emptyStateTitle}>No projects added yet.</h4>
                      <p style={styles.emptyStateSub}>Showcase your projects to improve your internship profile and attract recruiters.</p>
                    </div>
                  ) : myProjects.map(p => (
                    <div key={p.id} style={styles.dataItemRow}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                        <div style={{flex:1}}>
                          <h4 style={{...styles.itemTitle, color: '#8b5cf6'}}>
                            🌟 {p.title}
                            {p.tech_stack && <span style={{...styles.soonBadge, marginLeft:'10px', backgroundColor:'#f5f3ff', color:'#8b5cf6'}}>{p.tech_stack}</span>}
                          </h4>
                          {p.description && <p style={styles.itemDescription}>{p.description}</p>}
                          {p.link && (
                            <a href={p.link} target="_blank" rel="noreferrer" style={styles.projectLinkText}>🔗 {p.link}</a>
                          )}
                        </div>
                        <div style={{display:'flex', gap:'8px', marginLeft:'16px', flexShrink:0}}>
                          <button onClick={() => handleEditProject(p)} style={{...styles.signOutBtn, fontSize:'12px', padding:'6px 12px'}}>✏️ Edit</button>
                          <button onClick={() => handleDeleteProject(p.id)} style={{...styles.signOutBtn, fontSize:'12px', padding:'6px 12px', color:'#b91c1c', borderColor:'#fecaca'}}>🗑️ Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Bottom Grid Cards (Recent Applications, Upcoming Interviews, Profile Completion) */}
          {user.role === 'Student' && (
            <div style={styles.bottomStatusGrid}>
              <div style={styles.miniStatusCard}>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={styles.miniIcon}>📊</span><span style={styles.soonBadge}>SOON</span></div>
                <h4 style={styles.miniTitle}>Recent Applications</h4>
                <p style={styles.miniSub}>Track the status of your submitted internship applications.</p>
              </div>
              <div style={styles.miniStatusCard}>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={styles.miniIcon}>📅</span><span style={styles.soonBadge}>SOON</span></div>
                <h4 style={styles.miniTitle}>Upcoming Interviews</h4>
                <p style={styles.miniSub}>View scheduled interviews and prepare with AI-guided tips.</p>
              </div>
              <div style={styles.miniStatusCard}>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={styles.miniIcon}>👤</span><span style={styles.soonBadge}>SOON</span></div>
                <h4 style={styles.miniTitle}>Profile Completion</h4>
                <p style={styles.miniSub}>Complete your student profile to increase visibility to recruiters.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Notifications Feed + Upsell Badges */}
        <div style={styles.rightColumn}>
          <section style={styles.contentCard}>
            <div style={{ ...styles.cardHeader, borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <span style={{ ...styles.cardIcon, backgroundColor: '#eff6ff', color: '#2563eb' }}>🔔</span>
              <div>
                <h3 style={{ ...styles.cardTitle, margin: 0 }}>Alerts Feed</h3>
                <span style={styles.alertUnreadText}>{unreadCount} unread</span>
              </div>

              <div style={styles.alertHeaderActions}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    style={styles.markAllButton}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={fetchNotifications}
                  style={styles.syncRefreshBtn}
                  aria-label="Refresh notifications"
                >
                  🔄
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                  <div style={styles.bellEmptyIcon}>🔔</div>
                  <h5 style={{ margin: '10px 0 4px 0', fontSize: '14px', color: '#1e293b' }}>No notifications</h5>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>We'll notify you about applications, interviews, and deadlines.</p>
                </div>
              ) : notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => markNotificationAsRead(notification.id)}
                  style={{
                    ...styles.notificationBubble,
                    ...(notification.is_read
                      ? styles.notificationBubbleRead
                      : styles.notificationBubbleUnread)
                  }}
                >
                  <span style={styles.notificationMessage}>
                    {notification.message}
                  </span>
                  <span style={styles.notificationTime}>
                    {formatNotificationTime(notification.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Premium Sidebar Utilities */}
          <div style={styles.sidebarSoonUtilityCard}>
            <div style={styles.utilLeft}><span style={styles.utilIconSquare}>⚡</span><strong>Skill Match Score</strong></div>
            <span style={styles.soonBadge}>COMING SOON</span>
          </div>
          <div style={styles.sidebarSoonUtilityCard}>
            <div style={styles.utilLeft}><span style={{...styles.utilIconSquare, color:'#10b981', backgroundColor:'#ecfdf5'}}>✅</span><strong>Eligibility Status</strong></div>
            <span style={styles.soonBadge}>COMING SOON</span>
          </div>
          <div style={styles.sidebarSoonUtilityCard}>
            <div style={styles.utilLeft}><span style={{...styles.utilIconSquare, color:'#8b5cf6', backgroundColor:'#f5f3ff'}}>📄</span><strong>Resume Builder</strong></div>
            <span style={styles.soonBadge}>COMING SOON</span>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  dashboardContainer: { minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: '60px' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '14px 40px', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoBadge: { backgroundColor: '#2563eb', color: '#fff', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' },
  logoText: { fontSize: '18px', fontWeight: '700', color: '#0f172a' },
  divider: { color: '#cbd5e1', margin: '0 4px' },
  breadcrumbLink: { fontSize: '14px', color: '#64748b' },
  breadcrumbArrow: { fontSize: '12px', color: '#94a3b8' },
  breadcrumbActive: { fontSize: '14px', color: '#2563eb', fontWeight: '600', textTransform: 'capitalize' },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  notificationWrapper: { position: 'relative' },
  notificationBellButton: { width: '38px', height: '38px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#ffffff', cursor: 'pointer', position: 'relative', color: '#64748b', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  notificationBadge: { position: 'absolute', top: '-5px', right: '-5px', minWidth: '18px', height: '18px', padding: '0 4px', boxSizing: 'border-box', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '20px', border: '2px solid #ffffff', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  notificationDropdown: { position: 'absolute', top: '48px', right: 0, width: '360px', maxHeight: '430px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 20px 45px rgba(15,23,42,0.18)', overflow: 'hidden', zIndex: 1000 },
  notificationDropdownHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #e2e8f0' },
  notificationDropdownTitle: { margin: 0, fontSize: '15px', color: '#0f172a' },
  notificationDropdownSubtitle: { display: 'block', marginTop: '3px', fontSize: '11px', color: '#64748b' },
  notificationDropdownList: { maxHeight: '340px', overflowY: 'auto' },
  notificationDropdownItem: { width: '100%', border: 'none', borderBottom: '1px solid #f1f5f9', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' },
  notificationDropdownItemUnread: { backgroundColor: '#eff6ff' },
  notificationDropdownItemRead: { backgroundColor: '#ffffff' },
  notificationEmptyText: { margin: 0, padding: '30px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' },
  userAvatar: { width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#0ea5e9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
  userRoleText: { fontSize: '12px', color: '#64748b', textTransform: 'capitalize' },
  signOutBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#334155', transition: 'all 0.2s' },
  
  heroBanner: { background: 'linear-gradient(135deg, #1e40af 0%, #0284c7 60%, #0d9488 100%)', margin: '30px 40px', borderRadius: '20px', padding: '40px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(30,64,175,0.15)' },
  heroLeft: { flex: 1, zIndex: 2 },
  workspacePill: { display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: '600', marginBottom: '16px', backdropFilter: 'blur(4px)' },
  heroTitle: { fontSize: '32px', fontWeight: '700', margin: '0 0 10px 0', letterSpacing: '-0.5px' },
  heroSubtitle: { fontSize: '15px', color: 'rgba(255,255,255,0.85)', margin: '0 0 30px 0', maxWidth: '600px', lineHeight: '1.5' },
  metricsRow: { display: 'flex', gap: '16px' },
  metricCard: { backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '14px 24px', borderRadius: '14px', minWidth: '100px' },
  metricValue: { display: 'block', fontSize: '24px', fontWeight: '700', marginBottom: '2px' },
  metricLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.75)' },
  heroIllustration: { position: 'absolute', right: '40px', bottom: '10px', width: '220px', height: '160px', opacity: 0.25, zIndex: 1 },
  graphicWindow: { width: '100%', height: '100%', border: '3px solid #fff', borderRadius: '12px', padding: '15px', boxSizing: 'border-box' },
  graphicLines: { width: '50%', height: '6px', backgroundColor: '#fff', borderRadius: '4px' },

  workspaceLayout: { display: 'grid', gridTemplateColumns: '2.1fr 0.9fr', gap: '30px', margin: '0 40px' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '30px' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '16px' },
  
  contentCard: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', position: 'relative' },
  cardIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' },
  cardSub: { fontSize: '13px', color: '#64748b', margin: 0 },
  resultsBadge: { position: 'absolute', right: 0, top: '8px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '12px', padding: '4px 10px', borderRadius: '30px', fontWeight: '500' },
  
  searchBarRow: { display: 'flex', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '6px 6px 6px 16px', alignItems: 'center', gap: '10px' },
  searchInnerIcon: { color: '#94a3b8', fontSize: '16px' },
  searchInputField: { flex: 1, border: 'none', outline: 'none', color: '#334155', fontSize: '14px', backgroundColor: 'transparent' },
  primaryActionBtn: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 4px 12px rgba(37,99,235,0.15)' },
  
  filterChipsRow: { display: 'flex', gap: '8px', marginTop: '12px' },
  chipPill: { fontSize: '13px', color: '#475569', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 16px', borderRadius: '30px', cursor: 'pointer' },
  
  emptyIllustrationState: { textAlign: 'center', padding: '40px 20px', border: '1px dashed #e2e8f0', borderRadius: '14px', backgroundColor: '#f8fafc' },
  searchLensGraphic: { width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', position: 'relative' },
  emptyStateTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' },
  emptyStateSub: { fontSize: '13px', color: '#64748b', margin: 0, maxWidth: '340px', margin: '0 auto', lineHeight: '1.5' },
  
  dataItemRow: { padding: '20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' },
  itemTitle: { fontSize: '16px', fontWeight: '700', color: '#2563eb', margin: '0 0 6px 0' },
  itemDescription: { fontSize: '14px', color: '#475569', margin: '0 0 12px 0', lineHeight: '1.5' },
  itemMetaLine: { display: 'flex', gap: '10px', fontSize: '12px', color: '#64748b', marginBottom: '14px' },
  applyInlineBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' },
  deadlineClosedBadge: { display: 'inline-block', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: '700', padding: '6px 14px', borderRadius: '6px', letterSpacing: '0.2px' },
  
  formLayout: { display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldLabel: { fontSize: '13px', fontWeight: '600', color: '#344155' },
  textInput: { width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fff', color: '#334155', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  projectItemBar: { display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' },
  projectLinkText: { color: '#8b5cf6', textDecoration: 'none', fontWeight: '500' },
  
  bottomStatusGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '10px' },
  miniStatusCard: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' },
  miniIcon: { fontSize: '20px' },
  miniTitle: { fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '12px 0 4px 0' },
  miniSub: { fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.4' },
  soonBadge: { backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' },
  
  alertUnreadText: { display: 'block', marginTop: '3px', fontSize: '11px', color: '#64748b' },
  alertHeaderActions: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' },
  markAllButton: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '11px', fontWeight: '600', padding: '4px' },
  syncRefreshBtn: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '16px', padding: '4px' },
  bellEmptyIcon: { fontSize: '28px', color: '#cbd5e1' },
  notificationBubble: { width: '100%', padding: '12px 14px', borderRadius: '10px', borderLeft: '4px solid #2563eb', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontSize: '13px', lineHeight: '1.4', color: '#334155', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' },
  notificationBubbleUnread: { backgroundColor: '#eff6ff', fontWeight: '600' },
  notificationBubbleRead: { backgroundColor: '#ffffff', fontWeight: '400', opacity: 0.82 },
  notificationMessage: { color: '#334155', fontSize: '13px', lineHeight: '1.4' },
  notificationTime: { color: '#94a3b8', fontSize: '10px', fontWeight: '400' },
  
  sidebarSoonUtilityCard: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' },
  utilLeft: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#0f172a' },
  utilIconSquare: { width: '32px', height: '32px', backgroundColor: '#fff7ed', color: '#f97316', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }
};