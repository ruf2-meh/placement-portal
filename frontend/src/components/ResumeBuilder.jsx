import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ResumeBuilder.css';

// ─── helpers ─────────────────────────────────────────────────────────────────
const emptyEdu = () => ({ institution: '', degree: '', startYear: '', endYear: '' });
const emptyExp = () => ({ company: '', role: '', startDate: '', endDate: '', description: '' });
const emptyLinks = () => ({ linkedin: '', github: '', portfolio: '' });

export default function ResumeBuilder() {
  // Identify the logged-in user the same way Dashboard.jsx does
  const user = JSON.parse(localStorage.getItem('user')) || { id: 1, name: '', role: 'Student' };

  // ── form state ──────────────────────────────────────────────────────────────
  const [fullName, setFullName]     = useState(user.name || '');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [summary, setSummary]       = useState('');
  const [education, setEducation]   = useState([emptyEdu()]);
  const [experience, setExperience] = useState([emptyExp()]);
  const [skills, setSkills]         = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [links, setLinks]           = useState(emptyLinks());
  const [includeProjects, setIncludeProjects] = useState(true);

  // ── project list (fetched when include_projects toggled on) ─────────────────
  const [projects, setProjects] = useState([]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [saving, setSaving]   = useState(false);
  const [status, setStatus]   = useState(null); // { type: 'success'|'error', msg }

  // ── On mount: load existing resume ─────────────────────────────────────────
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/portal/resume/${user.id}`);
        const r = res.data;
        setFullName(r.full_name || '');
        setEmail(r.email || '');
        setPhone(r.phone || '');
        setSummary(r.summary || '');
        setEducation(Array.isArray(r.education) && r.education.length ? r.education : [emptyEdu()]);
        setExperience(Array.isArray(r.experience) && r.experience.length ? r.experience : [emptyExp()]);
        setSkills(Array.isArray(r.skills) ? r.skills : []);
        setLinks(r.links && typeof r.links === 'object' ? r.links : emptyLinks());
        setIncludeProjects(r.include_projects !== undefined ? r.include_projects : true);
      } catch (err) {
        // 404 = no resume yet — leave form empty, no crash
        if (err.response?.status !== 404) {
          console.error('Error loading resume:', err);
        }
      }
    };
    fetchResume();
  }, [user.id]);

  // ── Load projects whenever includeProjects is true ──────────────────────────
  useEffect(() => {
    if (!includeProjects) { setProjects([]); return; }
    const fetchProjects = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/portal/projects/${user.id}`);
        setProjects(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setProjects([]);
      }
    };
    fetchProjects();
  }, [includeProjects, user.id]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setStatus({ type: 'error', msg: 'Full name is required.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await axios.post('http://localhost:5000/api/portal/resume', {
        student_id: user.id,
        full_name: fullName,
        email,
        phone,
        summary,
        education,
        experience,
        skills,
        links,
        include_projects: includeProjects
      });
      setStatus({ type: 'success', msg: '✅ Resume saved successfully!' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Error saving resume.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Education helpers ───────────────────────────────────────────────────────
  const updateEdu = (i, field, val) =>
    setEducation(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  const addEdu    = () => setEducation(prev => [...prev, emptyEdu()]);
  const removeEdu = (i) => setEducation(prev => prev.filter((_, idx) => idx !== i));

  // ── Experience helpers ──────────────────────────────────────────────────────
  const updateExp = (i, field, val) =>
    setExperience(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  const addExp    = () => setExperience(prev => [...prev, emptyExp()]);
  const removeExp = (i) => setExperience(prev => prev.filter((_, idx) => idx !== i));

  // ── Skills helpers ──────────────────────────────────────────────────────────
  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = skillInput.trim().replace(/,$/, '');
      if (trimmed && !skills.includes(trimmed)) {
        setSkills(prev => [...prev, trimmed]);
      }
      setSkillInput('');
    }
  };
  const removeSkill = (s) => setSkills(prev => prev.filter(sk => sk !== s));

  // ── Download PDF ────────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ── Derived: filter out empty education/experience rows for preview ──────────
  const previewEdu = education.filter(e => e.institution || e.degree);
  const previewExp = experience.filter(e => e.company || e.role);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="rb-page">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="rb-navbar">
        <div className="rb-nav-left">
          <div className="rb-logo-badge">🕒</div>
          <span className="rb-logo-text">InternSphere</span>
          <span className="rb-nav-divider">|</span>
          <span className="rb-breadcrumb">Dashboard</span>
          <span className="rb-breadcrumb-arrow">&gt;</span>
          <span className="rb-breadcrumb-active">Resume Builder</span>
        </div>
        <div className="rb-nav-right">
          <a href="/dashboard" className="rb-back-btn">← Back to Dashboard</a>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="rb-hero">
        <div className="rb-hero-pill">● Resume Builder</div>
        <h1 className="rb-hero-title">Build Your Professional Resume</h1>
        <p className="rb-hero-sub">
          Fill in your details, see a live preview, and download a clean PDF — no extra tools needed.
        </p>
      </div>

      {/* ── Two-column layout: Form | Preview ──────────────────────────────── */}
      <div className="rb-layout">

        {/* ════════ LEFT: BUILDER FORM ════════════════════════════════════════ */}
        <div>
          <form onSubmit={handleSave}>

            {/* Personal Info */}
            <div className="rb-card">
              <div className="rb-card-header">
                <div className="rb-card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>👤</div>
                <div>
                  <p className="rb-card-title">Personal Information</p>
                  <p className="rb-card-sub">Your name, contact details, and profile links</p>
                </div>
              </div>

              <div className="rb-form-row">
                <div className="rb-form-group">
                  <label className="rb-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    id="rb-full-name"
                    className="rb-input"
                    type="text"
                    placeholder="e.g. Jane Doe"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="rb-form-group">
                  <label className="rb-label">Email</label>
                  <input
                    id="rb-email"
                    className="rb-input"
                    type="email"
                    placeholder="jane@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="rb-form-row">
                <div className="rb-form-group">
                  <label className="rb-label">Phone</label>
                  <input
                    id="rb-phone"
                    className="rb-input"
                    type="tel"
                    placeholder="+1 555 000 0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <p className="rb-section-title">Links</p>
              <div className="rb-form-row">
                <div className="rb-form-group">
                  <label className="rb-label">LinkedIn URL</label>
                  <input
                    id="rb-linkedin"
                    className="rb-input"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={links.linkedin}
                    onChange={e => setLinks(l => ({ ...l, linkedin: e.target.value }))}
                  />
                </div>
                <div className="rb-form-group">
                  <label className="rb-label">GitHub URL</label>
                  <input
                    id="rb-github"
                    className="rb-input"
                    type="url"
                    placeholder="https://github.com/..."
                    value={links.github}
                    onChange={e => setLinks(l => ({ ...l, github: e.target.value }))}
                  />
                </div>
              </div>
              <div className="rb-form-group">
                <label className="rb-label">Portfolio URL</label>
                <input
                  id="rb-portfolio"
                  className="rb-input"
                  type="url"
                  placeholder="https://myportfolio.com"
                  value={links.portfolio}
                  onChange={e => setLinks(l => ({ ...l, portfolio: e.target.value }))}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="rb-card" style={{ marginTop: '20px' }}>
              <div className="rb-card-header">
                <div className="rb-card-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>📝</div>
                <div>
                  <p className="rb-card-title">Professional Summary</p>
                  <p className="rb-card-sub">2–3 sentences about your goals and strengths</p>
                </div>
              </div>
              <textarea
                id="rb-summary"
                className="rb-textarea"
                placeholder="Motivated Computer Science student with experience in full-stack development..."
                value={summary}
                onChange={e => setSummary(e.target.value)}
                style={{ minHeight: '90px' }}
              />
            </div>

            {/* Education */}
            <div className="rb-card" style={{ marginTop: '20px' }}>
              <div className="rb-card-header">
                <div className="rb-card-icon" style={{ background: '#fef9c3', color: '#ca8a04' }}>🎓</div>
                <div>
                  <p className="rb-card-title">Education</p>
                  <p className="rb-card-sub">Degrees, institutions, and years attended</p>
                </div>
              </div>

              {education.map((edu, i) => (
                <div key={i} className="rb-entry-block">
                  {education.length > 1 && (
                    <button type="button" className="rb-entry-remove" onClick={() => removeEdu(i)}>✕ Remove</button>
                  )}
                  <div className="rb-form-row">
                    <div className="rb-form-group">
                      <label className="rb-label">Institution</label>
                      <input
                        className="rb-input"
                        type="text"
                        placeholder="e.g. MIT"
                        value={edu.institution}
                        onChange={e => updateEdu(i, 'institution', e.target.value)}
                      />
                    </div>
                    <div className="rb-form-group">
                      <label className="rb-label">Degree / Program</label>
                      <input
                        className="rb-input"
                        type="text"
                        placeholder="e.g. B.Sc. Computer Science"
                        value={edu.degree}
                        onChange={e => updateEdu(i, 'degree', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="rb-form-row">
                    <div className="rb-form-group">
                      <label className="rb-label">Start Year</label>
                      <input
                        className="rb-input"
                        type="text"
                        placeholder="2020"
                        value={edu.startYear}
                        onChange={e => updateEdu(i, 'startYear', e.target.value)}
                      />
                    </div>
                    <div className="rb-form-group">
                      <label className="rb-label">End Year</label>
                      <input
                        className="rb-input"
                        type="text"
                        placeholder="2024 or Present"
                        value={edu.endYear}
                        onChange={e => updateEdu(i, 'endYear', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="rb-add-btn" onClick={addEdu}>+ Add Education</button>
            </div>

            {/* Experience */}
            <div className="rb-card" style={{ marginTop: '20px' }}>
              <div className="rb-card-header">
                <div className="rb-card-icon" style={{ background: '#fdf2f8', color: '#9333ea' }}>💼</div>
                <div>
                  <p className="rb-card-title">Work Experience</p>
                  <p className="rb-card-sub">Internships, part-time roles, freelance work</p>
                </div>
              </div>

              {experience.map((exp, i) => (
                <div key={i} className="rb-entry-block">
                  {experience.length > 1 && (
                    <button type="button" className="rb-entry-remove" onClick={() => removeExp(i)}>✕ Remove</button>
                  )}
                  <div className="rb-form-row">
                    <div className="rb-form-group">
                      <label className="rb-label">Company</label>
                      <input
                        className="rb-input"
                        type="text"
                        placeholder="e.g. Google"
                        value={exp.company}
                        onChange={e => updateExp(i, 'company', e.target.value)}
                      />
                    </div>
                    <div className="rb-form-group">
                      <label className="rb-label">Role / Title</label>
                      <input
                        className="rb-input"
                        type="text"
                        placeholder="e.g. Software Engineering Intern"
                        value={exp.role}
                        onChange={e => updateExp(i, 'role', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="rb-form-row">
                    <div className="rb-form-group">
                      <label className="rb-label">Start Date</label>
                      <input
                        className="rb-input"
                        type="text"
                        placeholder="Jun 2023"
                        value={exp.startDate}
                        onChange={e => updateExp(i, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="rb-form-group">
                      <label className="rb-label">End Date</label>
                      <input
                        className="rb-input"
                        type="text"
                        placeholder="Aug 2023 or Present"
                        value={exp.endDate}
                        onChange={e => updateExp(i, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="rb-form-group">
                    <label className="rb-label">Description</label>
                    <textarea
                      className="rb-textarea"
                      placeholder="Key responsibilities and achievements..."
                      value={exp.description}
                      onChange={e => updateExp(i, 'description', e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <button type="button" className="rb-add-btn" onClick={addExp}>+ Add Experience</button>
            </div>

            {/* Skills */}
            <div className="rb-card" style={{ marginTop: '20px' }}>
              <div className="rb-card-header">
                <div className="rb-card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>⚡</div>
                <div>
                  <p className="rb-card-title">Skills</p>
                  <p className="rb-card-sub">Press Enter or comma to add each skill</p>
                </div>
              </div>
              <input
                id="rb-skill-input"
                className="rb-input"
                type="text"
                placeholder="e.g. React, Python, SQL…"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
              />
              {skills.length > 0 && (
                <div className="rb-skills-tags">
                  {skills.map(s => (
                    <span key={s} className="rb-skill-tag">
                      {s}
                      <button
                        type="button"
                        className="rb-skill-tag-remove"
                        onClick={() => removeSkill(s)}
                        aria-label={`Remove ${s}`}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Projects toggle */}
            <div className="rb-card" style={{ marginTop: '20px' }}>
              <label className="rb-checkbox-row">
                <input
                  id="rb-include-projects"
                  type="checkbox"
                  checked={includeProjects}
                  onChange={e => setIncludeProjects(e.target.checked)}
                />
                Include my projects in the resume
              </label>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 27px' }}>
                Pulls from your Project Portfolio Showcase on the Dashboard.
              </p>
            </div>

            {/* Save & PDF buttons */}
            <div className="rb-actions" style={{ marginTop: '20px' }}>
              <button
                id="rb-save-btn"
                type="submit"
                className="rb-save-btn"
                disabled={saving}
              >
                {saving ? 'Saving…' : '💾 Save Resume'}
              </button>
              <button
                id="rb-pdf-btn"
                type="button"
                className="rb-pdf-btn"
                onClick={handlePrint}
              >
                🖨️ Download PDF
              </button>
            </div>

            {status && (
              <div className={`rb-status rb-status-${status.type}`}>
                {status.msg}
              </div>
            )}
          </form>
        </div>

        {/* ════════ RIGHT: LIVE PREVIEW ════════════════════════════════════════ */}
        <div className="rb-preview-panel">
          <div className="rb-card rb-card-header" style={{ marginBottom: '16px' }}>
            <div className="rb-card-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>👁️</div>
            <div>
              <p className="rb-card-title">Live Preview</p>
              <p className="rb-card-sub">Updates as you type · this is what prints</p>
            </div>
          </div>

          {/* The printable area */}
          <div id="resume-print-area">

            {/* Header */}
            <div className="rp-header">
              <p className="rp-name">{fullName || 'Your Name'}</p>
              <div className="rp-contact">
                {email     && <span>✉ {email}</span>}
                {phone     && <span>📞 {phone}</span>}
                {links.linkedin  && <span>🔗 <a href={links.linkedin}  target="_blank" rel="noreferrer">LinkedIn</a></span>}
                {links.github    && <span>💻 <a href={links.github}    target="_blank" rel="noreferrer">GitHub</a></span>}
                {links.portfolio && <span>🌐 <a href={links.portfolio} target="_blank" rel="noreferrer">Portfolio</a></span>}
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div className="rp-section">
                <p className="rp-section-title">Professional Summary</p>
                <p className="rp-summary-text">{summary}</p>
              </div>
            )}

            {/* Education */}
            {previewEdu.length > 0 && (
              <div className="rp-section">
                <p className="rp-section-title">Education</p>
                {previewEdu.map((edu, i) => (
                  <div key={i} className="rp-entry">
                    <div className="rp-entry-top">
                      <span className="rp-entry-name">{edu.institution}</span>
                      <span className="rp-entry-dates">{edu.startYear}{edu.startYear && edu.endYear ? ' – ' : ''}{edu.endYear}</span>
                    </div>
                    {edu.degree && <p className="rp-entry-sub">{edu.degree}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Experience */}
            {previewExp.length > 0 && (
              <div className="rp-section">
                <p className="rp-section-title">Experience</p>
                {previewExp.map((exp, i) => (
                  <div key={i} className="rp-entry">
                    <div className="rp-entry-top">
                      <span className="rp-entry-name">{exp.company}</span>
                      <span className="rp-entry-dates">{exp.startDate}{exp.startDate && exp.endDate ? ' – ' : ''}{exp.endDate}</span>
                    </div>
                    {exp.role        && <p className="rp-entry-sub">{exp.role}</p>}
                    {exp.description && <p className="rp-entry-desc">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="rp-section">
                <p className="rp-section-title">Skills</p>
                <div className="rp-skills-list">
                  {skills.map(s => <span key={s} className="rp-skill-chip">{s}</span>)}
                </div>
              </div>
            )}

            {/* Projects (conditionally rendered) */}
            {includeProjects && projects.length > 0 && (
              <div className="rp-section">
                <p className="rp-section-title">Projects</p>
                {projects.map(p => (
                  <div key={p.id} className="rp-project">
                    <p className="rp-project-title">{p.title}</p>
                    {p.link && (
                      <p className="rp-project-link">
                        <a href={p.link} target="_blank" rel="noreferrer">{p.link}</a>
                      </p>
                    )}
                    {p.description && <p className="rp-project-desc">{p.description}</p>}
                  </div>
                ))}
              </div>
            )}

          </div>{/* end #resume-print-area */}
        </div>

      </div>{/* end .rb-layout */}
    </div>
  );
}
