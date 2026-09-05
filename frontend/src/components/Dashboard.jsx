import React, { useState } from 'react';

export default function Dashboard({ user, profile, notifications = [], onSignOut }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div style={styles.dashboardContainer}>
      {/* Navigation Bar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <span style={styles.logoBadge}>🎓</span>
          <span style={styles.logoText}>finx</span>
          <span style={styles.divider}>|</span>
          <button
            style={{
              ...styles.navTabBtn,
              fontWeight: activeTab === 'overview' ? '700' : '500',
              color: activeTab === 'overview' ? '#2563eb' : '#64748b'
            }}
            onClick={() => setActiveTab('overview')}
          >
            Dashboard
          </button>
          <button
            style={{
              ...styles.navTabBtn,
              fontWeight: activeTab === 'profile' ? '700' : '500',
              color: activeTab === 'profile' ? '#2563eb' : '#64748b'
            }}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </div>

        <div style={styles.navRight}>
          {/* Notification Menu */}
          <div style={styles.notificationWrapper}>
            <button
              style={styles.notificationBellButton}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
              {notifications.some((n) => !n.read) && (
                <span style={styles.notificationBadge}>
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={styles.notificationDropdown}>
                <div style={styles.notificationDropdownHeader}>
                  <div>
                    <h4 style={styles.notificationDropdownTitle}>Notifications</h4>
                    <span style={styles.notificationDropdownSubtitle}>
                      {notifications.filter((n) => !n.read).length} unread
                    </span>
                  </div>
                  <button style={styles.markAllButton}>Mark all as read</button>
                </div>

                <div style={styles.notificationDropdownList}>
                  {notifications.length === 0 ? (
                    <div style={styles.emptyIllustrationState}>
                      <span style={styles.bellEmptyIcon}>🔔</span>
                      <p style={styles.notificationEmptyText}>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((item, idx) => (
                      <button
                        key={idx}
                        style={{
                          ...styles.notificationDropdownItem,
                          ...(item.read
                            ? styles.notificationDropdownItemRead
                            : styles.notificationDropdownItemUnread)
                        }}
                      >
                        <span style={styles.notificationMessage}>{item.message}</span>
                        <span style={styles.notificationTime}>{item.time || 'Just now'}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Header */}
          <div style={styles.profileHeaderBtn}>
            <div style={styles.userAvatar}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user?.name || 'User'}</span>
              <span style={styles.userRoleText}>{user?.role || 'Student'}</span>
            </div>
          </div>

          <button style={styles.signOutBtn} onClick={onSignOut}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </nav>

      {/* Hero Banner */}
      <section style={styles.heroBanner}>
        <div style={styles.heroLeft}>
          <span style={styles.workspacePill}>Student Workspace</span>
          <h1 style={styles.heroTitle}>Welcome back, {user?.name || 'Student'}! 👋</h1>
          <p style={styles.heroSubtitle}>
            Track opportunities, manage application progress, and build out your developer profile in one central hub.
          </p>
        </div>
      </section>

      {/* Workspace Layout */}
      <div style={styles.workspaceLayout}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* Main Card */}
          <div style={styles.contentCard}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#eff6ff', color: '#2563eb' }}>
                🔍
              </div>
              <div>
                <h3 style={styles.cardTitle}>Explore Opportunities</h3>
                <p style={styles.cardSub}>Search for loans, internships, or open projects</p>
              </div>
              <span style={styles.resultsBadge}>Active</span>
            </div>

            <div style={styles.searchBarRow}>
              <input
                type="text"
                placeholder="Search by role, skill, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInputField}
              />
              <button style={styles.primaryActionBtn}>Search</button>
            </div>
          </div>

          {/* Profile Form Card */}
          {activeTab === 'profile' && (
            <div style={styles.contentCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIcon, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                  ✏️
                </div>
                <div>
                  <h3 style={styles.cardTitle}>Edit Profile</h3>
                  <p style={styles.cardSub}>Update your academic details and portfolio</p>
                </div>
              </div>

              <div style={styles.formLayout}>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Major / Discipline</label>
                  <input
                    type="text"
                    defaultValue={profile?.major || ''}
                    placeholder="e.g. Computer Science"
                    style={styles.textInput}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Skills (comma separated)</label>
                  <input
                    type="text"
                    defaultValue={profile?.skills || ''}
                    placeholder="e.g. React, PHP, MySQL"
                    style={styles.textInput}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>CGPA</label>
                  <input
                    type="text"
                    defaultValue={profile?.cgpa || ''}
                    placeholder="e.g. 3.8"
                    style={styles.textInput}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Resume Link</label>
                  <input
                    type="url"
                    defaultValue={profile?.resume_url || ''}
                    placeholder="https://..."
                    style={styles.textInput}
                  />
                </div>
                <button style={{ ...styles.primaryActionBtn, marginTop: '8px' }}>
                  Save Profile
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Column */}
        <div style={styles.rightColumn}>
          {profile && (
            <section style={styles.contentCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIcon, backgroundColor: '#fef3c7', color: '#d97706' }}>
                  👤
                </div>
                <div>
                  <h3 style={{ ...styles.cardTitle, margin: 0 }}>My Profile</h3>
                  <p style={{ ...styles.cardSub, margin: 0 }}>Quick Profile Summary</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155' }}>
                <div><strong>Major:</strong> {profile.major || 'Not set'}</div>
                <div><strong>Skills:</strong> {profile.skills || 'No skills added'}</div>
                <div><strong>CGPA:</strong> {profile.cgpa || 'N/A'}</div>
                {profile.resume_url && (
                  <div style={{ marginTop: '4px' }}>
                    <a
                      href={profile.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}
                    >
                      📄 View Resume
                    </a>
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveTab('profile')}
                style={{ ...styles.primaryActionBtn, marginTop: '16px', width: '100%', padding: '8px 12px', fontSize: '13px' }}
              >
                ✏️ Edit Student Profile
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline Styles Object
const styles = {
  dashboardContainer: {
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#0f172a',
    paddingBottom: '40px'
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 32px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoBadge: { fontSize: '20px' },
  logoText: { fontSize: '20px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' },
  divider: { color: '#cbd5e1', fontSize: '18px' },
  navTabBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '6px 12px' },
  navRight: { display: 'flex', alignItems: 'center', gap: '20px' },

  notificationWrapper: { position: 'relative' },
  notificationBellButton: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: '38px',
    height: '38px',
    cursor: 'pointer',
    fontSize: '16px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  notificationBadge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 'bold',
    borderRadius: '10px',
    padding: '2px 6px',
    border: '2px solid #ffffff'
  },
  notificationDropdown: {
    position: 'absolute',
    right: 0,
    top: '48px',
    width: '320px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    zIndex: 200
  },
  notificationDropdownHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  notificationDropdownTitle: { margin: 0, fontSize: '14px', fontWeight: '700', color: '#0f172a' },
  notificationDropdownSubtitle: { fontSize: '11px', color: '#64748b' },
  markAllButton: { background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  notificationDropdownList: { maxHeight: '300px', overflowY: 'auto' },
  notificationEmptyText: { padding: '20px', textAlign: 'center', margin: 0, fontSize: '13px', color: '#64748b' },
  notificationDropdownItem: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    padding: '12px 16px',
    textAlign: 'left',
    border: 'none',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    background: 'none'
  },
  notificationDropdownItemUnread: { backgroundColor: '#eff6ff' },
  notificationDropdownItemRead: { backgroundColor: '#ffffff' },
  notificationMessage: { fontSize: '13px', color: '#1e293b', marginBottom: '4px', lineHeight: '1.4' },
  notificationTime: { fontSize: '10px', color: '#94a3b8' },

  profileHeaderBtn: { display: 'flex', alignItems: 'center', gap: '10px' },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px'
  },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '13px', fontWeight: '700', color: '#0f172a' },
  userRoleText: { fontSize: '11px', color: '#64748b' },
  signOutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    cursor: 'pointer'
  },

  heroBanner: {
    padding: '32px',
    backgroundColor: '#1e293b',
    color: '#ffffff',
    margin: '24px 32px',
    borderRadius: '16px'
  },
  heroLeft: { maxWidth: '700px' },
  workspacePill: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#38bdf8',
    marginBottom: '12px'
  },
  heroTitle: { margin: '0 0 8px 0', fontSize: '26px', fontWeight: '800' },
  heroSubtitle: { margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' },

  workspaceLayout: { display: 'flex', gap: '24px', padding: '0 32px' },
  leftColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' },
  rightColumn: { width: '340px', display: 'flex', flexDirection: 'column', gap: '24px' },

  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  cardIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0
  },
  cardTitle: { margin: '0 0 2px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' },
  cardSub: { margin: 0, fontSize: '12px', color: '#64748b' },
  resultsBadge: {
    marginLeft: 'auto',
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 10px',
    backgroundColor: '#f1f5f9',
    borderRadius: '12px',
    color: '#475569'
  },

  formLayout: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldLabel: { fontSize: '12px', fontWeight: '700', color: '#334155' },
  textInput: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  primaryActionBtn: {
    padding: '10px 18px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    alignSelf: 'flex-start'
  },

  searchBarRow: { display: 'flex', gap: '12px' },
  searchInputField: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none'
  },

  dataItemRow: {
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc'
  },
  itemTitle: { margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', color: '#1e293b' },
  itemDescription: { margin: '0 0 10px 0', fontSize: '13px', color: '#475569', lineHeight: '1.4' },
  itemMetaLine: { display: 'flex', gap: '8px', fontSize: '12px', color: '#64748b', alignItems: 'center', marginBottom: '10px' },
  deadlineClosedBadge: { fontSize: '12px', fontWeight: '700', color: '#b91c1c' },
  applyInlineBtn: {
    padding: '6px 14px',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer'
  },
  soonBadge: { padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' },
  projectLinkText: { fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: '600', display: 'inline-block', marginTop: '6px' },

  emptyIllustrationState: { textAlign: 'center', padding: '30px 20px' },
  searchLensGraphic: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    margin: '0 auto 12px auto'
  },
  emptyStateTitle: { margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#1e293b' },
  emptyStateSub: { margin: 0, fontSize: '12px', color: '#64748b', maxWidth: '300px', marginInline: 'auto' },

  alertUnreadText: { fontSize: '11px', color: '#2563eb', fontWeight: '600' },
  bellEmptyIcon: { fontSize: '24px', opacity: 0.5 },
  notificationBubble: {
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%'
  },
  notificationBubbleUnread: { backgroundColor: '#eff6ff', borderLeft: '3px solid #2563eb' },
  notificationBubbleRead: { backgroundColor: '#f8fafc', borderLeft: '3px solid #cbd5e1' }
};