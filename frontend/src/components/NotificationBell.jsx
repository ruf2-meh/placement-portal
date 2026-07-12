import { useEffect, useState } from 'react';
import axios from 'axios';
import './NotificationBell.css';

const API_URL = 'http://localhost:5000/api/portal';

function NotificationBell({ userId }) {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const unreadCount = notifications.filter(
        notification => !notification.is_read
    ).length;

    const fetchNotifications = async () => {
        if (!userId) return;

        try {
            setLoading(true);

            const response = await axios.get(
                `${API_URL}/notifications/${userId}`
            );

            setNotifications(response.data);
        } catch (error) {
            console.error('Could not load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [userId]);

    const handleNotificationClick = async notification => {
        if (notification.is_read) return;

        try {
            await axios.patch(
                `${API_URL}/notifications/${notification.id}/read`,
                {
                    user_id: userId
                }
            );

            setNotifications(currentNotifications =>
                currentNotifications.map(item =>
                    item.id === notification.id
                        ? { ...item, is_read: true }
                        : item
                )
            );
        } catch (error) {
            console.error('Could not mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.patch(
                `${API_URL}/notifications/${userId}/read-all`
            );

            setNotifications(currentNotifications =>
                currentNotifications.map(notification => ({
                    ...notification,
                    is_read: true
                }))
            );
        } catch (error) {
            console.error('Could not mark all notifications as read:', error);
        }
    };

    return (
        <div className="notification-wrapper">
            <button
                className="notification-bell"
                onClick={() => setIsOpen(current => !current)}
                aria-label="Open notifications"
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
                                        {new Date(
                                            notification.createdAt
                                        ).toLocaleString()}
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