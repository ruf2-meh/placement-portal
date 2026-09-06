import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import './NotificationBell.css';

const API_URL = 'http://localhost:5000/api/portal';

// Utility for clean, relative timestamps
const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
};

function NotificationBell({ userId }) {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(item => !item.is_read).length;

    // Axios authorization config
    const getAuthConfig = () => {
        const token = localStorage.getItem('token');
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    };

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const response = await axios.get(
                `${API_URL}/notifications/${userId}`,
                getAuthConfig()
            );
            setNotifications(response.data);
        } catch (error) {
            console.error('Could not load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Handle outside clicks & ESC key press to close dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleNotificationClick = async (notification) => {
        if (notification.is_read) return;

        // Optimistic UI update
        setNotifications(prev =>
            prev.map(item =>
                item.id === notification.id ? { ...item, is_read: true } : item
            )
        );

        try {
            await axios.patch(
                `${API_URL}/notifications/${notification.id}/read`,
                { user_id: userId },
                getAuthConfig()
            );
        } catch (error) {
            console.error('Could not mark notification as read:', error);
            // Revert on failure
            setNotifications(prev =>
                prev.map(item =>
                    item.id === notification.id ? { ...item, is_read: false } : item
                )
            );
        }
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;

        const previousState = [...notifications];

        // Optimistic UI update
        setNotifications(prev =>
            prev.map(item => ({ ...item, is_read: true }))
        );

        try {
            await axios.patch(
                `${API_URL}/notifications/${userId}/read-all`,
                {},
                getAuthConfig()
            );
        } catch (error) {
            console.error('Could not mark all notifications as read:', error);
            // Revert state if backend request fails
            setNotifications(previousState);
        }
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <button
                className="notification-bell"
                onClick={() => setIsOpen(current => !current)}
                aria-label="Open notifications"
                aria-expanded={isOpen}
            >
                <span className="bell-icon">🔔</span>

                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>

                        {unreadCount > 0 && (
                            <button
                                className="mark-all-button"
                                onClick={handleMarkAllAsRead}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {loading && (
                            <p className="notification-status">
                                Loading notifications...
                            </p>
                        )}

                        {!loading && notifications.length === 0 && (
                            <p className="notification-status">
                                No notifications yet.
                            </p>
                        )}

                        {!loading &&
                            notifications.map(notification => (
                                <button
                                    key={notification.id}
                                    className={`notification-item ${
                                        notification.is_read ? 'read' : 'unread'
                                    }`}
                                    onClick={() =>
                                        handleNotificationClick(notification)
                                    }
                                >
                                    <span className="notification-message">
                                        {notification.message}
                                    </span>

                                    <span className="notification-time">
                                        {formatRelativeTime(notification.createdAt)}
                                    </span>
                                </button>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;