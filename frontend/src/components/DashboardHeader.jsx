import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardHeader = ({ user, roleName = 'Student' }) => {
    const navigate = useNavigate();

    const handleSignOut = () => {
        // Clear tokens/user data from storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();

        // Redirect to login or home page
        navigate('/login');
    };

    // Generate initials from user name (e.g., "Rufaida Mehzabin Raita" -> "RMR")
    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 3);
    };

    const userName = user?.name || user?.fullName || 'User Name';
    const initials = getInitials(userName);

    return (
        <header style={styles.headerContainer}>
            {/* LEFT: LOGO AND BREADCRUMBS */}
            <div style={styles.leftSection}>
                <div style={styles.logoBadge}>
                    <span style={styles.logoIcon}>🛡️</span>
                    <span style={styles.logoText}>HireHive</span>
                </div>
                <span style={styles.divider}>|</span>
                <span style={styles.breadcrumb}>
                    Dashboard {'>'} <span style={styles.activeBreadcrumb}>{roleName}</span>
                </span>
            </div>

            {/* RIGHT: NOTIFICATIONS, AVATAR, USER INFO, SIGN OUT */}
            <div style={styles.rightSection}>
                {/* NOTIFICATION BELL */}
                <div style={styles.bellContainer}>
                    <span style={{ fontSize: '18px' }}>🔔</span>
                    <span style={styles.notificationBadge}>1</span>
                </div>

                {/* USER AVATAR & NAME */}
                <div style={styles.userSection}>
                    <div style={styles.avatar}>{initials}</div>
                    <div style={styles.userInfo}>
                        <span style={styles.userName}>{userName}</span>
                        <span style={styles.userRole}>{roleName}</span>
                    </div>
                </div>

                {/* SIGN OUT BUTTON */}
                <button onClick={handleSignOut} style={styles.signOutBtn}>
                    <span style={styles.signOutIcon}>🚪</span> Sign Out
                </button>
            </div>
        </header>
    );
};

const styles = {
    headerContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: '12px 28px',
        borderBottom: '1px solid #e2e8f0',
        fontFamily: 'Inter, system-ui, sans-serif'
    },
    leftSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    logoBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    logoIcon: {
        fontSize: '20px'
    },
    logoText: {
        fontSize: '18px',
        fontWeight: '800',
        color: '#0f172a'
    },
    divider: {
        color: '#cbd5e1',
        fontWeight: '300'
    },
    breadcrumb: {
        fontSize: '13px',
        color: '#64748b'
    },
    activeBreadcrumb: {
        color: '#2563eb',
        fontWeight: '600'
    },
    rightSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
    },
    bellContainer: {
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center'
    },
    notificationBadge: {
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        backgroundColor: '#ef4444',
        color: '#ffffff',
        fontSize: '10px',
        fontWeight: '700',
        borderRadius: '50%',
        width: '15px',
        height: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    userSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    avatar: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        backgroundColor: '#0EA5E9',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '13px'
    },
    userInfo: {
        display: 'flex',
        flexDirection: 'column'
    },
    userName: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#0f172a',
        lineHeight: '1.2'
    },
    userRole: {
        fontSize: '11px',
        color: '#64748b',
        textTransform: 'capitalize'
    },
    signOutBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '6px 14px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#334155',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    signOutIcon: {
        color: '#d97706',
        fontSize: '12px'
    }
};

export default DashboardHeader;