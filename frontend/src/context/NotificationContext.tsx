import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

// Types
import type { Notification } from '../types/notification';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  archiveNotification: (notificationId: string, isArchived: boolean) => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  clearNotifications: () => void;
  showBrowserNotification: (notification: Notification) => void;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// API base URL
const API_URL = (import.meta as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL || 'http://localhost:8000/api';

// Provider component
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const { socket, isConnected, sendMessage } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?._id) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        params: { userId: user._id },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        const fetchedNotifications = response.data.data || [];
        setNotifications(fetchedNotifications);
        
        // Count unread notifications
        const unread = fetchedNotifications.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message || error.message 
        : 'Failed to fetch notifications';
      setError(message);
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?._id, token]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!isAuthenticated || !token) return false;
    
    try {
      const response = await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, [isAuthenticated, token]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !token) return false;
    
    try {
      const response = await axios.put(
        `${API_URL}/notifications/mark-all-read`,
        { userId: user?._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, [isAuthenticated, token, user?._id]);

  // Archive notification
  const archiveNotification = useCallback(async (
    notificationId: string, 
    isArchived: boolean
  ): Promise<boolean> => {
    if (!isAuthenticated || !token) return false;
    
    try {
      const response = await axios.put(
        `${API_URL}/notifications/${notificationId}/archive`,
        { isArchived },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, isArchived } : n
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error archiving notification:', error);
      return false;
    }
  }, [isAuthenticated, token]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!isAuthenticated || !token) return false;
    
    try {
      const response = await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.filter(n => n._id !== notificationId)
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [isAuthenticated, token]);

  // Clear all notifications from state
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return;
    }

    // Check permission
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showNotification(notification);
        }
      });
    } else {
      showNotification(notification);
    }

    const showNotification = (notif: Notification) => {
      const notification = new Notification(notif.title, {
        body: notif.message,
        icon: '/favicon.ico',
        data: {
          url: notif.actionUrl,
          notificationId: notif._id,
        },
      });

      // Close notification after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Handle click
      notification.onclick = (event) => {
        event.preventDefault();
        if (notif.actionUrl) {
          window.open(notif.actionUrl, '_blank');
        }
        // Mark as read
        markAsRead(notif._id as string);
      };
    };
  }, [markAsRead]);

  // Listen for WebSocket notifications
  useEffect(() => {
    if (!isAuthenticated || !user?._id || !isConnected) return;

    const handleNewNotification = (message: any) => {
      if (message.type === 'NEW_NOTIFICATION') {
        const newNotification = message.data as Notification;
        
        // Add to state
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification
        showBrowserNotification(newNotification);
        
        // Show toast
        toast.success(newNotification.title, {
          description: newNotification.message,
          duration: 5000,
        });
      }
    };

    // This would be handled by the WebSocket context
    // For now, we'll just poll for notifications
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, user?._id, isConnected, fetchNotifications, showBrowserNotification]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      fetchNotifications();
    } else {
      clearNotifications();
    }
  }, [isAuthenticated, user?._id, fetchNotifications, clearNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    clearNotifications,
    showBrowserNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Export context for testing
export { NotificationContext };
