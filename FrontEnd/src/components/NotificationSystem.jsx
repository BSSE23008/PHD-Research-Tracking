import React, { useState, useEffect } from 'react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  formatDateTime,
  formatDate
} from '../utils/api';

const NotificationSystem = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    thisWeek: 0
  });

  useEffect(() => {
    loadNotifications();
    // Set up polling for new notifications
    const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [filter]);

  const loadNotifications = async () => {
    try {
      const params = {};
      if (filter === 'unread') params.is_read = false;
      if (filter === 'read') params.is_read = true;

      const result = await getNotifications(params);
      if (result.success) {
        const notificationData = result.data.notifications || [];
        setNotifications(notificationData);
        calculateStats(notificationData);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (notificationData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    setStats({
      total: notificationData.length,
      unread: notificationData.filter(n => !n.is_read).length,
      today: notificationData.filter(n => new Date(n.created_at) >= today).length,
      thisWeek: notificationData.filter(n => new Date(n.created_at) >= thisWeek).length
    });
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        calculateStats(notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead();
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        calculateStats(notifications.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      form_submission: '📝',
      form_approval: '✅',
      form_rejection: '❌',
      deadline_reminder: '⏰',
      supervisor_assignment: '👨‍🏫',
      gec_formation: '👥',
      system_update: '🔧',
      welcome: '👋',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅',
      error: '❌'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type, priority) => {
    const colors = {
      high: 'border-l-red-500 bg-red-50',
      medium: 'border-l-yellow-500 bg-yellow-50',
      low: 'border-l-blue-500 bg-blue-50',
      form_approval: 'border-l-green-500 bg-green-50',
      form_rejection: 'border-l-red-500 bg-red-50',
      deadline_reminder: 'border-l-orange-500 bg-orange-50',
      system_update: 'border-l-purple-500 bg-purple-50'
    };
    return colors[type] || colors[priority] || 'border-l-gray-500 bg-gray-50';
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.is_read;
      case 'read':
        return notification.is_read;
      default:
        return true;
    }
  });

  const groupNotificationsByDate = (notifications) => {
    const groups = {};
    notifications.forEach(notification => {
      const date = formatDate(notification.created_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(notification);
    });
    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">Stay updated with your PhD journey</p>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Total</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
              <div className="text-sm text-red-800">Unread</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats.today}</div>
              <div className="text-sm text-green-800">Today</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.thisWeek}</div>
              <div className="text-sm text-purple-800">This Week</div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex justify-between items-center pb-6 border-b">
            <div className="flex space-x-4">
              {['all', 'unread', 'read'].map(filterOption => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize ${
                    filter === filterOption
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption}
                  {filterOption === 'unread' && stats.unread > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {stats.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={loadNotifications}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Refresh
              </button>
              {stats.unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {Object.keys(groupedNotifications).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </h3>
            <p className="text-gray-600">
              {filter === 'unread'
                ? 'You\'re all caught up! Check back later for new updates.'
                : 'You don\'t have any notifications yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedNotifications)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([date, dayNotifications]) => (
                <div key={date} className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    {date === formatDate(new Date()) ? 'Today' : 
                     date === formatDate(new Date(Date.now() - 86400000)) ? 'Yesterday' : 
                     date}
                  </h2>
                  
                  <div className="space-y-3">
                    {dayNotifications.map(notification => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onSelect={setSelectedNotification}
                        getIcon={getNotificationIcon}
                        getColor={getNotificationColor}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkAsRead={handleMarkAsRead}
          getIcon={getNotificationIcon}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

const NotificationCard = ({ notification, onMarkAsRead, onSelect, getIcon, getColor }) => {
  return (
    <div 
      className={`bg-white border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        getColor(notification.type, notification.priority)
      } ${!notification.is_read ? 'border-opacity-100' : 'border-opacity-50 opacity-75'}`}
      onClick={() => onSelect(notification)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="text-2xl">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`text-lg font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                  {notification.title}
                </h3>
                {!notification.is_read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
                {notification.priority === 'high' && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    High Priority
                  </span>
                )}
              </div>
              <p className={`text-sm mb-2 ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                {notification.message}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {formatDateTime(notification.created_at)}
                </span>
                {notification.action_url && (
                  <span className="text-xs text-blue-600 font-medium">
                    Action required →
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {!notification.is_read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="ml-4 px-3 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationModal = ({ notification, onClose, onMarkAsRead, getIcon, onNavigate }) => {
  const handleActionClick = () => {
    if (notification.action_url) {
      // Parse the action URL to navigate appropriately
      if (notification.action_url.includes('/forms/')) {
        const formCode = notification.action_url.split('/').pop();
        onNavigate('forms', formCode);
      } else if (notification.action_url.includes('/admin')) {
        onNavigate('admin');
      } else {
        onNavigate('dashboard');
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">
              {getIcon(notification.type)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{notification.title}</h2>
              <p className="text-sm text-gray-600">
                {formatDateTime(notification.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed">{notification.message}</p>
          
          {notification.metadata && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Additional Details</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {Object.entries(notification.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {notification.priority && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {notification.priority} priority
              </span>
            )}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              notification.is_read ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {notification.is_read ? 'Read' : 'Unread'}
            </span>
          </div>

          <div className="flex space-x-3">
            {!notification.is_read && (
              <button
                onClick={() => {
                  onMarkAsRead(notification.id);
                  onClose();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Mark as Read
              </button>
            )}
            
            {notification.action_url && (
              <button
                onClick={handleActionClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Take Action
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSystem; 