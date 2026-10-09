import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Calendar, CheckCircle, XCircle, Eye, Trash2, Search, Filter } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Notification, NotificationType } from '../../types/notification';

const NotificationPage: React.FC = () => {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [readFilter, setReadFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiService.get<{ success: boolean; data: Notification[]; message?: string }>(
          `/notifications?user=${user?._id}`
        );
        
        if (response.success) {
          setNotifications(response.data || []);
          setFilteredNotifications(response.data || []);
        } else {
          setError(response.message || 'Failed to fetch notifications');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch notifications');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?._id) {
      fetchNotifications();
    }
  }, [user?._id]);

  useEffect(() => {
    // Apply filters
    let filtered = [...notifications];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notification => 
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    }
    
    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(notification => notification.type === typeFilter as NotificationType);
    }
    
    // Read filter
    if (readFilter) {
      const isRead = readFilter === 'read';
      filtered = filtered.filter(notification => notification.isRead === isRead);
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, searchQuery, typeFilter, readFilter]);

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'EVENT':
        return <Calendar className="w-5 h-5 text-tangerine-500" />;
      case 'APPLICATION':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ASSIGNMENT':
        return <div className="w-5 h-5 bg-orchid-100 rounded flex items-center justify-center text-orchid-600 text-xs font-bold">A</div>;
      case 'TASK':
        return <div className="w-5 h-5 bg-tangerine-100 rounded flex items-center justify-center text-tangerine-600 text-xs font-bold">T</div>;
      case 'ANNOUNCEMENT':
        return <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs font-bold">!</div>;
      case 'ATTENDANCE':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'BADGE':
        return <div className="w-5 h-5 bg-yellow-100 rounded flex items-center justify-center text-yellow-600 text-xs font-bold">★</div>;
      case 'REVIEW':
        return <div className="w-5 h-5 bg-orchid-100 rounded flex items-center justify-center text-orchid-600 text-xs font-bold">R</div>;
      case 'SYSTEM':
        return <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-gray-600 text-xs font-bold">S</div>;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeText = (type: NotificationType) => {
    switch (type) {
      case 'EVENT':
        return 'Event';
      case 'APPLICATION':
        return 'Application';
      case 'ASSIGNMENT':
        return 'Assignment';
      case 'TASK':
        return 'Task';
      case 'ANNOUNCEMENT':
        return 'Announcement';
      case 'ATTENDANCE':
        return 'Attendance';
      case 'BADGE':
        return 'Badge';
      case 'REVIEW':
        return 'Review';
      case 'SYSTEM':
        return 'System';
      default:
        return type;
    }
  };

  const markAsRead = async (notification: Notification) => {
    try {
      const response = await apiService.patch<{ success: boolean; data: Notification }>(
        `/notifications/${notification._id}/read`,
        { isRead: true }
      );
      
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
      }
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiService.patch<{ success: boolean }>(
        `/notifications/mark-all-read?user=${user?._id}`,
        { isRead: true }
      );
      
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (notification: Notification) => {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        `/notifications/${notification._id}`
      );
      
      if (response.success) {
        setNotifications(prev => prev.filter(n => n._id !== notification._id));
      }
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
    }
  };

  const types: NotificationType[] = [
    'EVENT', 'APPLICATION', 'ASSIGNMENT', 'TASK', 'ANNOUNCEMENT',
    'ATTENDANCE', 'BADGE', 'REVIEW', 'SYSTEM'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent mb-2">
            Notifications
          </h1>
          <p className="text-gray-500">Manage your notifications</p>
        </div>
        
        <Button onClick={markAllAsRead} variant="outline">
          Mark All as Read
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none transition-colors"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filters
          </Button>
        </div>
        
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-gray-100"
          >
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
            >
              <option value="">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{getTypeText(type)}</option>
              ))}
            </select>
            
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="read">Read</option>
              <option value="unread">Unread</option>
            </select>
            
            <Button
              variant="outline"
              onClick={() => {
                setTypeFilter('');
                setReadFilter('');
                setSearchQuery('');
              }}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        /* Notifications List */
        <>
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Notifications</h3>
              <p className="text-gray-500">You have no notifications yet</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification._id as string || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className={`p-4 ${!notification.isRead ? 'border-tangerine-200 bg-tangerine-50' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                          {!notification.isRead && (
                            <span className="px-2 py-1 bg-tangerine-100 text-tangerine-600 rounded-full text-xs font-medium">
                              New
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-500 text-sm mb-2">{notification.message}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {getTypeText(notification.type)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification)}
                            className="p-1.5 text-tangerine-500 hover:text-tangerine-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification)}
                          className="p-1.5"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification)}
                          className="p-1.5 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default NotificationPage;
