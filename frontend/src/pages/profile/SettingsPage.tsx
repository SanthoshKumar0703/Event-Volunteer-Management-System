import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Shield, Lock, User, Language, Moon, Sun, Save } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      makeProfilePublic: false,
      showEmail: false,
      showPhone: false,
    },
    preferences: {
      theme: 'system',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    security: {
      changePassword: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user settings from API
    const fetchSettings = async () => {
      try {
        const response = await apiService.get<{ success: boolean; data: any }>(
          `/users/${user?._id}/settings`
        );
        
        if (response.success) {
          setSettings(prev => ({
            ...prev,
            ...response.data
          }));
        }
      } catch (err: any) {
        console.error('Failed to fetch settings:', err);
      }
    };
    
    if (user?._id) {
      fetchSettings();
    }
  }, [user?._id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    
    if (type === 'checkbox') {
      if (name.startsWith('notifications.')) {
        const field = name.split('.')[1];
        setSettings(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            [field]: checked
          }
        }));
      } else if (name.startsWith('privacy.')) {
        const field = name.split('.')[1];
        setSettings(prev => ({
          ...prev,
          privacy: {
            ...prev.privacy,
            [field]: checked
          }
        }));
      }
    } else {
      if (name.startsWith('preferences.')) {
        const field = name.split('.')[1];
        setSettings(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            [field]: value
          }
        }));
      } else if (name.startsWith('security.')) {
        const field = name.split('.')[1];
        setSettings(prev => ({
          ...prev,
          security: {
            ...prev.security,
            [field]: value
          }
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate password change
      if (settings.security.newPassword && settings.security.newPassword !== settings.security.confirmPassword) {
        setError('New password and confirm password do not match');
        setIsSubmitting(false);
        return;
      }
      
      const response = await apiService.put<{ success: boolean; message?: string }>(
        `/users/${user?._id}/settings`,
        settings
      );
      
      if (response.success) {
        setSuccess('Settings updated successfully!');
      } else {
        setError(response.message || 'Failed to update settings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyTheme = (theme: string) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme(settings.preferences.theme);
  }, [settings.preferences.theme]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-gray-500">Manage your preferences and account settings</p>
      </div>

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-tangerine-500" />
            <h2 className="text-lg font-semibold text-gray-800">Notification Preferences</h2>
          </div>
          <p className="text-gray-500 mb-4">Choose how you want to receive notifications</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Email Notifications</p>
                <p className="text-gray-500 text-sm">Receive notifications via email</p>
              </div>
              <input
                type="checkbox"
                name="notifications.email"
                checked={settings.notifications.email}
                onChange={handleChange}
                className="w-5 h-5 text-tangerine-500 rounded focus:ring-tangerine-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Push Notifications</p>
                <p className="text-gray-500 text-sm">Receive push notifications in your browser</p>
              </div>
              <input
                type="checkbox"
                name="notifications.push"
                checked={settings.notifications.push}
                onChange={handleChange}
                className="w-5 h-5 text-tangerine-500 rounded focus:ring-tangerine-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">SMS Notifications</p>
                <p className="text-gray-500 text-sm">Receive notifications via SMS</p>
              </div>
              <input
                type="checkbox"
                name="notifications.sms"
                checked={settings.notifications.sms}
                onChange={handleChange}
                className="w-5 h-5 text-tangerine-500 rounded focus:ring-tangerine-500"
              />
            </div>
          </div>
        </Card>

        {/* Privacy */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-orchid-500" />
            <h2 className="text-lg font-semibold text-gray-800">Privacy Settings</h2>
          </div>
          <p className="text-gray-500 mb-4">Control who can see your information</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Make Profile Public</p>
                <p className="text-gray-500 text-sm">Allow anyone to view your profile</p>
              </div>
              <input
                type="checkbox"
                name="privacy.makeProfilePublic"
                checked={settings.privacy.makeProfilePublic}
                onChange={handleChange}
                className="w-5 h-5 text-tangerine-500 rounded focus:ring-tangerine-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Show Email Address</p>
                <p className="text-gray-500 text-sm">Display your email on your profile</p>
              </div>
              <input
                type="checkbox"
                name="privacy.showEmail"
                checked={settings.privacy.showEmail}
                onChange={handleChange}
                className="w-5 h-5 text-tangerine-500 rounded focus:ring-tangerine-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Show Phone Number</p>
                <p className="text-gray-500 text-sm">Display your phone number on your profile</p>
              </div>
              <input
                type="checkbox"
                name="privacy.showPhone"
                checked={settings.privacy.showPhone}
                onChange={handleChange}
                className="w-5 h-5 text-tangerine-500 rounded focus:ring-tangerine-500"
              />
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-800">Preferences</h2>
          </div>
          <p className="text-gray-500 mb-4">Customize your experience</p>
          
          <div className="space-y-4">
            <Input
              label="Theme"
              name="preferences.theme"
              type="select"
              value={settings.preferences.theme}
              onChange={handleChange}
            >
              <option value="system">System Default</option>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </Input>
            
            <Input
              label="Language"
              name="preferences.language"
              type="select"
              value={settings.preferences.language}
              onChange={handleChange}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="hi">हिन्दी</option>
              <option value="ta">தமிழ்</option>
            </Input>
            
            <Input
              label="Timezone"
              name="preferences.timezone"
              type="select"
              value={settings.preferences.timezone}
              onChange={handleChange}
            >
              <option value="UTC">UTC</option>
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="America/New_York">New York (EST)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </Input>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-800">Security</h2>
          </div>
          <p className="text-gray-500 mb-4">Change your password</p>
          
          <div className="space-y-4">
            <Input
              label="Current Password"
              name="security.currentPassword"
              type="password"
              value={settings.security.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
            />
            
            <Input
              label="New Password"
              name="security.newPassword"
              type="password"
              value={settings.security.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
            />
            
            <Input
              label="Confirm New Password"
              name="security.confirmPassword"
              type="password"
              value={settings.security.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
            />
          </div>
          
          {settings.security.newPassword && settings.security.newPassword !== settings.security.confirmPassword && (
            <p className="text-red-500 text-sm mt-2">Passwords do not match</p>
          )}
        </Card>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-lg">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <Card className="p-6">
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            <Save className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </Card>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
