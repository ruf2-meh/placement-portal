import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { id: 1, name: "Rufaida Mehzabin", role: "Student" };

  const [notifications, setNotifications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [projectForm, setProjectForm] = useState({ title: '', description: '', link: '' });
  const [myProjects, setMyProjects] = useState([]);
  const [myOffers, setMyOffers] = useState([]); // Feature 17 state

  // --- Feature 18: Weekly Diary Logs (Student) ---
  const [myInternships, setMyInternships] = useState([]);
  const [activeInternship, setActiveInternship] = useState('');
  const activeInternshipRef = useRef(''); // mirrors activeInternship for refetches
  const [myLogs, setMyLogs] = useState([]);
  const [logForm, setLogForm] = useState({ week_number: '', hours_worked: '', tasks_completed: '', challenges: '', learnings: '' });
  const [editingLogId, setEditingLogId] = useState(null); // null = creating a new entry

  // --- Feature 19: Mid-Term Reports (Company) ---
  const [myInterns, setMyInterns] = useState([]);
  const [activeIntern, setActiveIntern] = useState(null);
  const [internLogs, setInternLogs] = useState([]);
  const [midTermForm, setMidTermForm] = useState({ attendance_rating: 4, technical_rating: 4, communication_rating: 4, strengths: '', areas_to_improve: '', comments: '' });
  const [midTermExists, setMidTermExists] = useState(false);

  // --- Company States ---
  const [jobForm, setJobForm] = useState({ title: '', description: '', requirements: '', location: '', deadline: '' });
  const [myJobs, setMyJobs] = useState([]);

  useEffect(() => {
    fetchNotifications();
    if (user.role === 'Student') {
      fetchJobs();
      fetchMyProjects();
      fetchStudentOffers();
      fetchMyInternships();
    } else if (user.role === 'Company') {
      fetchCompanyJobs();
      fetchMyInterns();
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/portal/notifications/${user.id}`);
      setNotifications(res.data);
    } catch (err) { console.error("Error pulling notifications"); }
  };

  const fetchJobs = async (keyword = '') => {
    try {
      const res = await axios.get(`http://localhost:5000/api/portal/jobs/search?keyword=${keyword}`);
      setJobs(res.data);
    } catch (err) { console.error("Error pulling job board metrics"); }
  };

  const fetchCompanyJobs = async () => {
    try {
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

  const fetchStudentOffers = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/portal/student/${user.id}/offers`);
      setMyOffers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching student offers", err);
    }
  };

  const handleOfferDecision = async (applicationId, decision) => {
    try {
      await axios.patch(`http://localhost:5000/api/portal/applications/${applicationId}/offer-decision`, {
        decision
      });
      alert(`You have successfully ${decision} the offer.`);
      fetchStudentOffers();
      fetchNotifications();
      // Accepting an offer creates a new active internship, so the weekly
      // diary card must refresh too or it stays locked until a page reload.
      fetchMyInternships();
    } catch (err) {
      alert("Error recording decision.");
    }
  };

  // =====================================================================
  // FEATURE 18: Weekly Internship Diary Logs (Student side)
  // =====================================================================
  const fetchMyInternships = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/internship/student/${user.id}/internships`);
      const list = Array.isArray(res.data) ? res.data : [];
      setMyInternships(list);

      if (list.length === 0) {
        activeInternshipRef.current = '';
        setActiveInternship('');
        setMyLogs([]);
        return;
      }

      // Keep whatever the student is already viewing; only fall back to the
      // first internship when nothing is selected or the selection disappeared.
      const previous = activeInternshipRef.current;
      const stillValid = previous && list.some(item => String(item.application_id) === String(previous));
      const nextId = stillValid ? String(previous) : String(list[0].application_id);

      activeInternshipRef.current = nextId;
      setActiveInternship(nextId);
      fetchMyLogs(nextId);
    } catch (err) { console.error("Error pulling active internships"); }
  };

  const fetchMyLogs = async (applicationId) => {
    if (!applicationId) return setMyLogs([]);
    try {
      const res = await axios.get(`http://localhost:5000/api/internship/logs/${applicationId}`);
      setMyLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Error pulling weekly diary logs"); }
  };

  const handleInternshipSwitch = (applicationId) => {
    activeInternshipRef.current = applicationId;
    setActiveInternship(applicationId);
    // An in-progress edit belongs to the internship being left behind
    setEditingLogId(null);
    setLogForm(emptyLogForm);
    fetchMyLogs(applicationId);
  };

  const emptyLogForm = { week_number: '', hours_worked: '', tasks_completed: '', challenges: '', learnings: '' };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    if (!activeInternship) return alert("Select an internship first.");
    try {
      const res = editingLogId
        ? await axios.put(`http://localhost:5000/api/internship/logs/${editingLogId}`, {
            ...logForm,
            student_id: user.id
          })
        : await axios.post('http://localhost:5000/api/internship/logs', {
            ...logForm,
            application_id: activeInternship,
            student_id: user.id
          });

      alert(res.data.message);
      setLogForm(emptyLogForm);
      setEditingLogId(null);
      fetchMyLogs(activeInternship);
      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving weekly diary log.");
    }
  };

  const handleEditLog = (log) => {
    setEditingLogId(log.id);
    setLogForm({
      week_number: String(log.week_number ?? ''),
      hours_worked: String(log.hours_worked ?? ''),
      tasks_completed: log.tasks_completed || '',
      challenges: log.challenges || '',
      learnings: log.learnings || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setLogForm(emptyLogForm);
  };

  const handleDeleteLog = async (log) => {
    if (!window.confirm(`Delete your Week ${log.week_number} diary log? This cannot be undone.`)) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/internship/logs/${log.id}`, {
        data: { student_id: user.id }
      });
      alert(res.data.message);
      // Drop out of edit mode if the entry being edited is the one removed
      if (editingLogId === log.id) handleCancelEdit();
      fetchMyLogs(activeInternship);
      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting weekly diary log.");
    }
  };

  // =====================================================================
  // FEATURE 19: Mid-Term Performance Reports (Company side)
  // =====================================================================
  const fetchMyInterns = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/internship/company/${user.id}/interns`);
      setMyInterns(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Error pulling active interns"); }
  };

  const handleOpenIntern = async (intern) => {
    if (activeIntern && activeIntern.application_id === intern.application_id) {
      setActiveIntern(null);
      return;
    }
    setActiveIntern(intern);
    try {
      const [logsRes, reportRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/internship/logs/${intern.application_id}`),
        axios.get(`http://localhost:5000/api/internship/midterm/${intern.application_id}`)
      ]);
      setInternLogs(Array.isArray(logsRes.data) ? logsRes.data : []);

      const report = reportRes.data;
      setMidTermExists(!!report);
      setMidTermForm(report ? {
        attendance_rating: report.attendance_rating,
        technical_rating: report.technical_rating,
        communication_rating: report.communication_rating,
        strengths: report.strengths || '',
        areas_to_improve: report.areas_to_improve || '',
        comments: report.comments || ''
      } : { attendance_rating: 4, technical_rating: 4, communication_rating: 4, strengths: '', areas_to_improve: '', comments: '' });
    } catch (err) { console.error("Error loading intern progress record"); }
  };

  const handleSubmitMidTerm = async (e) => {
    e.preventDefault();
    if (!activeIntern) return;
    try {
      const res = await axios.post('http://localhost:5000/api/internship/midterm', {
        ...midTermForm,
        application_id: activeIntern.application_id,
        student_id: activeIntern.student_id,
        company_id: user.id
      });
      alert(res.data.message);
      setMidTermExists(true);
      fetchMyInterns();
      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving mid-term report.");
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/jobs', { ...jobForm, company_id: user.id });
      alert("🎉 Job posted successfully into backend system!");
      setJobForm({ title: '', description: '', requirements: '', location: '', deadline: '' });
      fetchNotifications();
      fetchCompanyJobs();
    } catch (err) { alert("Error dispatching job posting details."); }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/portal/projects', { ...projectForm, student_id: user.id });
      alert("✅ Project showcase linked to your profile!");
      setProjectForm({ title: '', description: '', link: '' });
      fetchMyProjects();
    } catch (err) { alert("Error adding showcase record."); }
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
    <span style={styles.logoText}>InternSphere</span>
    <div style={styles.divider}>|</div>
    <span style={styles.breadcrumbLink}>Dashboard</span>
    <span style={styles.breadcrumbArrow}>&gt;</span>
    <span style={styles.breadcrumbActive}>{user.role}</span>
    </div>
    <div style={styles.navRight}>
    <div style={styles.notificationBell}>🔔<span style={styles.bellDot}></span></div>
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

          {/* Actions: Shortlist Button + Live Feed Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
          onClick={() => navigate(`/shortlist/${job.id}`)}
          style={styles.shortlistBtn}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#eff6ff';
            e.currentTarget.style.color = '#2563eb';
          }}
          >
          Shortlist
          </button>

          <span style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontWeight: '600' }}>
          Live Feed
          </span>
          </div>
          </div>
          </div>
        ))}
        </div>
        </section>

        {/* FEATURE 19: Active Intern Progress & Mid-Term Performance Reports */}
        <section style={styles.contentCard}>
        <div style={styles.cardHeader}>
        <span style={{ ...styles.cardIcon, backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>🎓</span>
        <div>
        <h3 style={styles.cardTitle}>Intern Progress & Mid-Term Reviews</h3>
        <p style={styles.cardSub}>Read weekly diary submissions and file mid-term performance evaluations</p>
        </div>
        <button onClick={fetchMyInterns} style={styles.syncRefreshBtn}>🔄</button>
        </div>

        {myInterns.length === 0 ? (
          <div style={styles.internEmptyState}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎓</div>
          <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1e293b' }}>No active interns yet</h5>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Interns appear here once a student accepts your job offer.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myInterns.map(intern => (
            <div key={intern.application_id} style={styles.internCard}>

            <div style={styles.internHeaderRow} onClick={() => handleOpenIntern(intern)} role="button" tabIndex={0}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.internAvatar}>{intern.student_name ? intern.student_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'IN'}</div>
            <div>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{intern.student_name}</strong>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{intern.job_title} · {intern.student_email}</div>
            </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={styles.logCountPill}>{intern.log_count} log{intern.log_count === 1 ? '' : 's'}</span>
            <span style={intern.has_midterm > 0 ? styles.reviewDonePill : styles.reviewPendingPill}>
            {intern.has_midterm > 0 ? '✓ Reviewed' : 'Review Pending'}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>
            {activeIntern && activeIntern.application_id === intern.application_id ? '▲' : '▼'}
            </span>
            </div>
            </div>

            {activeIntern && activeIntern.application_id === intern.application_id && (
              <div style={styles.internExpandArea}>

              {/* Weekly diary logs filed by this intern */}
              <h5 style={styles.subSectionTitle}>📔 Weekly Diary Submissions</h5>
              {internLogs.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 18px 0' }}>This intern has not submitted any weekly logs yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '240px', overflowY: 'auto' }}>
                {internLogs.map(log => (
                  <div key={log.id} style={styles.logEntry}>
                  <div style={styles.logEntryHeader}>
                  <span style={styles.weekBadge}>Week {log.week_number}</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{log.hours_worked} hrs · {new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={styles.logLine}><strong>Tasks:</strong> {log.tasks_completed}</p>
                  {log.challenges && <p style={styles.logLine}><strong>Challenges:</strong> {log.challenges}</p>}
                  {log.learnings && <p style={styles.logLine}><strong>Learnings:</strong> {log.learnings}</p>}
                  </div>
                ))}
                </div>
              )}

              {/* Mid-term evaluation form */}
              <h5 style={styles.subSectionTitle}>
              📝 Mid-Term Performance Report {midTermExists && <span style={styles.editingPill}>Editing existing report</span>}
              </h5>
              <form onSubmit={handleSubmitMidTerm} style={styles.formLayout}>

              <div style={styles.ratingGrid}>
              {[
                { key: 'attendance_rating', label: 'Attendance & Punctuality' },
                { key: 'technical_rating', label: 'Technical Ability' },
                { key: 'communication_rating', label: 'Communication' }
              ].map(field => (
                <div key={field.key} style={styles.inputGroup}>
                <label style={styles.fieldLabel}>{field.label}</label>
                <div style={styles.starRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                  type="button"
                  key={n}
                  onClick={() => setMidTermForm({ ...midTermForm, [field.key]: n })}
                  style={{
                    ...styles.starBtn,
                    backgroundColor: midTermForm[field.key] >= n ? '#8b5cf6' : '#f1f5f9',
                    color: midTermForm[field.key] >= n ? '#ffffff' : '#94a3b8'
                  }}
                  >{n}</button>
                ))}
                </div>
                </div>
              ))}
              </div>

              <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Key Strengths</label>
              <textarea rows="2" placeholder="What has this intern done well so far?" value={midTermForm.strengths} onChange={e => setMidTermForm({ ...midTermForm, strengths: e.target.value })} style={styles.textInput} />
              </div>

              <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Areas to Improve</label>
              <textarea rows="2" placeholder="Where should they focus for the rest of the internship?" value={midTermForm.areas_to_improve} onChange={e => setMidTermForm({ ...midTermForm, areas_to_improve: e.target.value })} style={styles.textInput} />
              </div>

              <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Additional Manager Comments</label>
              <textarea rows="2" placeholder="Any other notes for the university placement office" value={midTermForm.comments} onChange={e => setMidTermForm({ ...midTermForm, comments: e.target.value })} style={styles.textInput} />
              </div>

              <button type="submit" style={{ ...styles.primaryActionBtn, backgroundColor: '#8b5cf6', boxShadow: '0 4px 12px rgba(139,92,246,0.2)' }}>
              {midTermExists ? 'Update Mid-Term Report' : 'Submit Mid-Term Report'}
              </button>
              </form>
              </div>
            )}
            </div>
          ))}
          </div>
        )}
        </section>
        </>
      ) : (
        <>
        {/* FEATURE 17: Conditional Job Offer Decision Card (Visible only when offers exist) */}
        {myOffers.length > 0 && (
          <section style={styles.offerCardWrapper}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '24px' }}>🎉</span>
          <div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e40af' }}>
          Action Required: You Have Job Offers!
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          Congratulations! Recruiters have reviewed and shortlisted your profile. Accept or decline below.
          </p>
          </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myOffers.map((offer) => (
            <div key={offer.id} style={styles.offerRowItem}>
            <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>
            {offer.Job?.title || 'Internship Role'}
            </h4>
            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '10px' }}>
            <span>📍 {offer.Job?.location || 'Remote'}</span>
            <span>•</span>
            <span>Status: <strong style={{ color: '#2563eb', textTransform: 'capitalize' }}>{offer.status}</strong></span>
            </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
            <button
            onClick={() => handleOfferDecision(offer.id, 'accepted')}
            style={styles.acceptBtn}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
            Accept Offer
            </button>
            <button
            onClick={() => handleOfferDecision(offer.id, 'rejected')}
            style={styles.rejectBtn}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
            Reject Offer
            </button>
            </div>
            </div>
          ))}
          </div>
          </section>
        )}

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

        <div style={styles.filterChipsRow}>
        {['Remote', 'On-site', 'Hybrid', 'Paid', 'Unpaid'].map(chip => (
          <span key={chip} style={styles.chipPill}>{chip}</span>
        ))}
        </div>

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
          <span>⏰ Deadline: <strong style={{ color: '#ef4444' }}>{job.deadline}</strong></span>
          </div>
          <button onClick={() => handleApply(job.id)} style={styles.applyInlineBtn}>Apply For Role</button>
          </div>
        ))}
        </div>
        </section>

        {/* Student Project Submission Showcasing Layout */}
        <section style={styles.contentCard}>
        <div style={styles.cardHeader}>
        <span style={{ ...styles.cardIcon, backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>📁</span>
        <div>
        <h3 style={styles.cardTitle}>Project Portfolio Showcase</h3>
        <p style={styles.cardSub}>Highlight your work to stand out to recruiters</p>
        </div>
        </div>

        <form onSubmit={handleAddProject} style={{ ...styles.searchBarRow, gap: '16px', alignItems: 'flex-end', background: 'none', padding: 0, marginTop: '20px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={styles.fieldLabel}>Project Title <span style={{color:'#ef4444'}}>*</span></label>
        <input type="text" placeholder="e.g. E-Commerce Web App" value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} style={styles.textInput} required />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={styles.fieldLabel}>Live Demo / GitHub URL</label>
        <input type="text" placeholder="https://github.com/..." value={projectForm.link} onChange={e => setProjectForm({...projectForm, link: e.target.value})} style={styles.textInput} />
        </div>
        <button type="submit" style={{ ...styles.primaryActionBtn, height: '45px' }}>+ Add Project</button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '25px' }}>
        {myProjects.length === 0 ? (
          <div style={styles.emptyIllustrationState}>
          <div style={{...styles.searchLensGraphic, backgroundColor: '#eff6ff', color: '#3b82f6'}}>📁<span style={{fontSize:'12px', position:'absolute', top:0, right:0}}>➕</span></div>
          <h4 style={styles.emptyStateTitle}>No projects added yet.</h4>
          <p style={styles.emptyStateSub}>Showcase your projects to improve your internship profile and attract recruiters.</p>
          </div>
        ) : myProjects.map(p => (
          <div key={p.id} style={styles.projectItemBar}>
          <span style={{marginRight: '8px'}}>🌟</span>
          <strong style={{ color: '#1e293b' }}>{p.title}</strong>
          <span style={{margin: '0 8px', color: '#cbd5e1'}}>—</span>
          <a href={p.link} target="_blank" rel="noreferrer" style={styles.projectLinkText}>{p.link || 'No Live Verification Link'}</a>
          </div>
        ))}
        </div>
        </section>

        {/* FEATURE 18: Weekly Internship Diary Logs */}
        <section style={styles.contentCard}>
        <div style={styles.cardHeader}>
        <span style={{ ...styles.cardIcon, backgroundColor: '#ecfdf5', color: '#10b981' }}>📔</span>
        <div>
        <h3 style={styles.cardTitle}>Weekly Internship Diary</h3>
        <p style={styles.cardSub}>Report your weekly progress so your manager and the university can track it</p>
        </div>
        </div>

        {myInternships.length === 0 ? (
          <div style={styles.internEmptyState}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📔</div>
          <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1e293b' }}>No active internship yet</h5>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Once you accept a job offer, your weekly diary opens up here.</p>
          </div>
        ) : (
          <>
          <div style={styles.inputGroup}>
          <label style={styles.fieldLabel}>Active Internship</label>
          <select value={activeInternship} onChange={e => handleInternshipSwitch(e.target.value)} style={styles.textInput}>
          {myInternships.map(item => (
            <option key={item.application_id} value={item.application_id}>
            {item.job_title} — {item.company_name} ({item.job_location})
            </option>
          ))}
          </select>
          </div>

          {editingLogId && (
            <div style={styles.editingBanner}>
            <span>✏️ Editing your Week {logForm.week_number || '—'} entry</span>
            <button type="button" onClick={handleCancelEdit} style={styles.cancelEditLink}>Cancel</button>
            </div>
          )}

          <form onSubmit={handleSubmitLog} style={styles.formLayout}>
          <div style={styles.weekHoursRow}>
          <div style={styles.inputGroup}>
          <label style={styles.fieldLabel}>Week Number <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="number" min="1" max="52" placeholder="e.g. 3" value={logForm.week_number} onChange={e => setLogForm({ ...logForm, week_number: e.target.value })} style={styles.textInput} required />
          </div>
          <div style={styles.inputGroup}>
          <label style={styles.fieldLabel}>Hours Worked</label>
          <input type="number" min="0" placeholder="e.g. 40" value={logForm.hours_worked} onChange={e => setLogForm({ ...logForm, hours_worked: e.target.value })} style={styles.textInput} />
          </div>
          </div>

          <div style={styles.inputGroup}>
          <label style={styles.fieldLabel}>Tasks Completed <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea rows="3" placeholder="What did you actually build or deliver this week?" value={logForm.tasks_completed} onChange={e => setLogForm({ ...logForm, tasks_completed: e.target.value })} style={styles.textInput} required />
          </div>

          <div style={styles.inputGroup}>
          <label style={styles.fieldLabel}>Challenges Faced</label>
          <textarea rows="2" placeholder="Anything that blocked or slowed you down" value={logForm.challenges} onChange={e => setLogForm({ ...logForm, challenges: e.target.value })} style={styles.textInput} />
          </div>

          <div style={styles.inputGroup}>
          <label style={styles.fieldLabel}>Key Learnings</label>
          <textarea rows="2" placeholder="New skills, tools or lessons picked up this week" value={logForm.learnings} onChange={e => setLogForm({ ...logForm, learnings: e.target.value })} style={styles.textInput} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ ...styles.primaryActionBtn, backgroundColor: '#10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
          {editingLogId ? 'Save Changes' : 'Submit Weekly Log'}
          </button>
          {editingLogId && (
            <button type="button" onClick={handleCancelEdit} style={styles.secondaryActionBtn}>
            Cancel
            </button>
          )}
          </div>
          </form>

          <div style={styles.diaryTimelineHeader}>
          <h5 style={{ ...styles.subSectionTitle, margin: 0 }}>Submitted Logs</h5>
          <span style={styles.logCountPill}>{myLogs.length} total</span>
          </div>

          {myLogs.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>No diary entries submitted for this internship yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {myLogs.map(log => (
              <div key={log.id} style={editingLogId === log.id ? { ...styles.logEntry, ...styles.logEntryEditing } : styles.logEntry}>
              <div style={styles.logEntryHeader}>
              <span style={{ ...styles.weekBadge, backgroundColor: '#ecfdf5', color: '#047857' }}>Week {log.week_number}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{log.hours_worked} hrs · {new Date(log.createdAt).toLocaleDateString()}</span>
              <button type="button" onClick={() => handleEditLog(log)} style={styles.logEditBtn} title="Edit this entry">✏️ Edit</button>
              <button type="button" onClick={() => handleDeleteLog(log)} style={styles.logDeleteBtn} title="Delete this entry">🗑️ Delete</button>
              </div>
              </div>
              <p style={styles.logLine}><strong>Tasks:</strong> {log.tasks_completed}</p>
              {log.challenges && <p style={styles.logLine}><strong>Challenges:</strong> {log.challenges}</p>}
              {log.learnings && <p style={styles.logLine}><strong>Learnings:</strong> {log.learnings}</p>}
              </div>
            ))}
            </div>
          )}
          </>
        )}
        </section>
        </>
      )}

      {/* Bottom Grid Cards */}
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

      {/* Right Sidebar */}
      <div style={styles.rightColumn}>
      <section style={styles.contentCard}>
      <div style={{ ...styles.cardHeader, borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
      <span style={{ ...styles.cardIcon, backgroundColor: '#eff6ff', color: '#2563eb' }}>🔔</span>
      <h3 style={{ ...styles.cardTitle, margin: 0 }}>Alerts Feed</h3>
      <button onClick={fetchNotifications} style={styles.syncRefreshBtn}>🔄</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
        <div style={styles.bellEmptyIcon}>🔔</div>
        <h5 style={{ margin: '10px 0 4px 0', fontSize: '14px', color: '#1e293b' }}>No new notifications</h5>
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>We'll notify you about applications, interviews, and deadlines.</p>
        </div>
      ) : notifications.map(notif => (
        <div key={notif.id} style={styles.notificationBubble}>
        {notif.message}
        </div>
      ))}
      </div>
      </section>

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
  notificationBell: { fontSize: '18px', cursor: 'pointer', position: 'relative', color: '#64748b' },
  bellDot: { position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%' },
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

  offerCardWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '2px solid #93c5fd',
    padding: '24px',
    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.08)'
  },
  offerRowItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px 20px'
  },
  acceptBtn: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  rejectBtn: {
    backgroundColor: '#ffffff',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    padding: '8px 18px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },

  searchBarRow: { display: 'flex', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '6px 6px 6px 16px', alignItems: 'center', gap: '10px' },
  searchInnerIcon: { color: '#94a3b8', fontSize: '16px' },
  searchInputField: { flex: 1, border: 'none', outline: 'none', color: '#334155', fontSize: '14px', backgroundColor: 'transparent' },
  // --- Feature 18 & 19: Internship tracking styles ---
  internEmptyState: { textAlign: 'center', padding: '34px 20px', border: '1px dashed #e2e8f0', borderRadius: '14px', backgroundColor: '#f8fafc' },
  internCard: { border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#ffffff', overflow: 'hidden' },
  internHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', backgroundColor: '#f8fafc' },
  internAvatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', flexShrink: 0 },
  internExpandArea: { padding: '18px 16px', borderTop: '1px solid #e2e8f0' },
  subSectionTitle: { fontSize: '13px', fontWeight: '700', color: '#334155', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' },
  logCountPill: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: '#f1f5f9', color: '#475569' },
  reviewDonePill: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: '#ecfdf5', color: '#047857' },
  reviewPendingPill: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: '#fef9c3', color: '#b45309' },
  editingPill: { padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb' },
  logEntry: { border: '1px solid #f1f5f9', borderRadius: '10px', padding: '12px 14px', backgroundColor: '#f8fafc' },
  logEntryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  weekBadge: { padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: '#f5f3ff', color: '#6d28d9' },
  logLine: { margin: '0 0 4px 0', fontSize: '12.5px', color: '#475569', lineHeight: '1.5' },
  ratingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' },
  starRow: { display: 'flex', gap: '6px' },
  starBtn: { width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.15s' },
  weekHoursRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  diaryTimelineHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 12px 0', paddingTop: '18px', borderTop: '1px solid #f1f5f9' },
  editingBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: '10px', fontSize: '12.5px', fontWeight: '600', marginBottom: '14px' },
  cancelEditLink: { background: 'none', border: 'none', color: '#92400e', fontWeight: '700', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' },
  secondaryActionBtn: { backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  logEditBtn: { background: 'none', border: '1px solid #cbd5e1', color: '#334155', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
  logDeleteBtn: { background: 'none', border: '1px solid #fca5a5', color: '#dc2626', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
  logEntryEditing: { borderColor: '#fbbf24', backgroundColor: '#fffbeb', boxShadow: '0 0 0 2px rgba(251,191,36,0.15)' },
  primaryActionBtn: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 4px 12px rgba(37,99,235,0.15)' },

  filterChipsRow: { display: 'flex', gap: '8px', marginTop: '12px' },
  chipPill: { fontSize: '13px', color: '#475569', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 16px', borderRadius: '30px', cursor: 'pointer' },

  emptyIllustrationState: { textAlign: 'center', padding: '40px 20px', border: '1px dashed #e2e8f0', borderRadius: '14px', backgroundColor: '#f8fafc' },
  searchLensGraphic: { width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', position: 'relative' },
  emptyStateTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' },
  emptyStateSub: { fontSize: '13px', color: '#64748b', maxWidth: '340px', margin: '0 auto', lineHeight: '1.5' },

  dataItemRow: { padding: '20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' },
  itemTitle: { fontSize: '16px', fontWeight: '700', color: '#2563eb', margin: '0 0 6px 0' },
  itemDescription: { fontSize: '14px', color: '#475569', margin: '0 0 12px 0', lineHeight: '1.5' },
  itemMetaLine: { display: 'flex', gap: '10px', fontSize: '12px', color: '#64748b', marginBottom: '14px' },
  applyInlineBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' },

  shortlistBtn: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out'
  },

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

    syncRefreshBtn: { position: 'absolute', right: 0, top: 0, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '16px' },
    bellEmptyIcon: { fontSize: '28px', color: '#cbd5e1' },
    notificationBubble: { padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '10px', borderLeft: '4px solid #2563eb', fontSize: '13px', lineHeight: '1.4', color: '#334155', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' },

    sidebarSoonUtilityCard: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' },
    utilLeft: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#0f172a' },
    utilIconSquare: { width: '32px', height: '32px', backgroundColor: '#fff7ed', color: '#f97316', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }
};
