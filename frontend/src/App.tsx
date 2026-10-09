import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import OrganizerLayout from './components/layout/OrganizerLayout';
import VolunteerLayout from './components/layout/VolunteerLayout';

// Pages
// Public
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';

// Event pages
import { EventListPage, EventDetailPage, EventCreatePage, EventEditPage } from './pages/events';

// Application pages
import { ApplicationListPage, ApplicationDetailPage, ApplicationCreatePage } from './pages/applications';

// Task pages
import { TaskListPage, TaskDetailPage, TaskCreatePage, TaskEditPage } from './pages/tasks';

// Shift pages
import { ShiftListPage, ShiftDetailPage, ShiftCreatePage, ShiftEditPage } from './pages/shifts';

// Attendance pages
import { AttendanceListPage, AttendanceDetailPage, CheckInPage } from './pages/attendance';

// Announcement pages
import { AnnouncementListPage, AnnouncementDetailPage, AnnouncementCreatePage, AnnouncementEditPage } from './pages/announcements';

// Review pages
import { ReviewListPage, ReviewDetailPage, ReviewCreatePage, ReviewEditPage } from './pages/reviews';

// Badge pages
import { BadgeListPage, BadgeDetailPage, BadgeEditPage } from './pages/badges';

// Analytics pages
import { AnalyticsDashboard, LeaderboardPage } from './pages/analytics';

// Profile pages
import { ProfilePage, ProfileEditPage, SettingsPage, NotificationPage } from './pages/profile';

// Calendar page
import { CalendarPage } from './pages/calendar';

// Event Request pages
import { EventRequestPage, EventRequestListPage, EventRequestDetailPage, EventRequestEditPage } from './pages/event_requests';

// Dashboard pages
import AdminDashboard from './pages/dashboard/admin/AdminDashboard';
import OrganizerDashboard from './pages/dashboard/organizer/OrganizerDashboard';
import VolunteerDashboard from './pages/dashboard/volunteer/VolunteerDashboard';

// Error pages
import NotFoundPage from './pages/NotFoundPage';
import MaintenancePage from './pages/MaintenancePage';

// Components
import LoadingScreen from './components/common/LoadingScreen';
import ScrollToTop from './components/common/ScrollToTop';

const App: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  if (isAppLoading || isLoading) {
    return <LoadingScreen />;
  }

  // Define routes based on authentication and role
  const getDashboardLayout = () => {
    if (!isAuthenticated) return null;
    
    switch (user?.role) {
      case 'ADMIN':
        return AdminLayout;
      case 'ORGANIZER':
        return OrganizerLayout;
      case 'VOLUNTEER':
        return VolunteerLayout;
      default:
        return VolunteerLayout;
    }
  };

  const DashboardLayout = getDashboardLayout();

  return (
    <div className={`min-h-screen bg-primary transition-colors duration-300 ${theme}`}>
      <ScrollToTop />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="min-h-screen"
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="verify-otp" element={<VerifyOTPPage />} />
              
              {/* Public Event Routes */}
              <Route path="events" element={<EventListPage role="VOLUNTEER" />} />
              <Route path="events/:id" element={<EventDetailPage />} />
            </Route>

            {/* Protected Routes */}
            {isAuthenticated && DashboardLayout && (
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={
                  user?.role === 'ADMIN' ? (
                    <Navigate to="/dashboard/admin" replace />
                  ) : user?.role === 'ORGANIZER' ? (
                    <Navigate to="/dashboard/organizer" replace />
                  ) : (
                    <Navigate to="/dashboard/volunteer" replace />
                  )
                } />
                
                {/* Admin Routes */}
                {user?.role === 'ADMIN' && (
                  <>
                    <Route path="admin" element={<AdminDashboard />} />
                    <Route path="admin/events" element={<EventListPage role="ADMIN" />} />
                    <Route path="admin/events/create" element={<EventCreatePage />} />
                    <Route path="admin/events/:id" element={<EventDetailPage />} />
                    <Route path="admin/events/:id/edit" element={<EventEditPage />} />
                    <Route path="admin/applications" element={<ApplicationListPage role="ADMIN" />} />
                    <Route path="admin/applications/:id" element={<ApplicationDetailPage />} />
                    <Route path="admin/tasks" element={<TaskListPage role="ADMIN" />} />
                    <Route path="admin/tasks/:id" element={<TaskDetailPage />} />
                    <Route path="admin/tasks/create" element={<TaskCreatePage />} />
                    <Route path="admin/tasks/:id/edit" element={<TaskEditPage />} />
                    <Route path="admin/shifts" element={<ShiftListPage role="ADMIN" />} />
                    <Route path="admin/shifts/:id" element={<ShiftDetailPage />} />
                    <Route path="admin/shifts/create" element={<ShiftCreatePage />} />
                    <Route path="admin/shifts/:id/edit" element={<ShiftEditPage />} />
                    <Route path="admin/attendance" element={<AttendanceListPage role="ADMIN" />} />
                    <Route path="admin/attendance/:id" element={<AttendanceDetailPage />} />
                    <Route path="admin/attendance/check-in" element={<CheckInPage />} />
                    <Route path="admin/announcements" element={<AnnouncementListPage role="ADMIN" />} />
                    <Route path="admin/announcements/:id" element={<AnnouncementDetailPage />} />
                    <Route path="admin/announcements/create" element={<AnnouncementCreatePage />} />
                    <Route path="admin/announcements/:id/edit" element={<AnnouncementEditPage />} />
                    <Route path="admin/reviews" element={<ReviewListPage role="ADMIN" />} />
                    <Route path="admin/reviews/:id" element={<ReviewDetailPage />} />
                    <Route path="admin/reviews/create" element={<ReviewCreatePage />} />
                    <Route path="admin/reviews/:id/edit" element={<ReviewEditPage />} />
                    <Route path="admin/badges" element={<BadgeListPage role="ADMIN" />} />
                    <Route path="admin/badges/:id" element={<BadgeDetailPage />} />
                    <Route path="admin/badges/:id/edit" element={<BadgeEditPage />} />
                    <Route path="admin/analytics" element={<AnalyticsDashboard />} />
                    <Route path="admin/leaderboard" element={<LeaderboardPage />} />
                    <Route path="admin/event-requests" element={<EventRequestListPage role="ADMIN" />} />
                    <Route path="admin/event-requests/:id" element={<EventRequestDetailPage />} />
                    <Route path="admin/event-requests/:id/edit" element={<EventRequestEditPage />} />
                    <Route path="admin/calendar" element={<CalendarPage />} />
                    <Route path="admin/*" element={<AdminDashboard />} />
                  </>
                )}
                
                {/* Organizer Routes */}
                {user?.role === 'ORGANIZER' && (
                  <>
                    <Route path="organizer" element={<OrganizerDashboard />} />
                    <Route path="organizer/events" element={<EventListPage role="ORGANIZER" />} />
                    <Route path="organizer/events/create" element={<EventCreatePage />} />
                    <Route path="organizer/events/:id" element={<EventDetailPage />} />
                    <Route path="organizer/events/:id/edit" element={<EventEditPage />} />
                    <Route path="organizer/applications" element={<ApplicationListPage role="ORGANIZER" />} />
                    <Route path="organizer/applications/:id" element={<ApplicationDetailPage />} />
                    <Route path="organizer/tasks" element={<TaskListPage role="ORGANIZER" />} />
                    <Route path="organizer/tasks/:id" element={<TaskDetailPage />} />
                    <Route path="organizer/tasks/create" element={<TaskCreatePage />} />
                    <Route path="organizer/tasks/:id/edit" element={<TaskEditPage />} />
                    <Route path="organizer/shifts" element={<ShiftListPage role="ORGANIZER" />} />
                    <Route path="organizer/shifts/:id" element={<ShiftDetailPage />} />
                    <Route path="organizer/shifts/create" element={<ShiftCreatePage />} />
                    <Route path="organizer/shifts/:id/edit" element={<ShiftEditPage />} />
                    <Route path="organizer/attendance" element={<AttendanceListPage role="ORGANIZER" />} />
                    <Route path="organizer/attendance/:id" element={<AttendanceDetailPage />} />
                    <Route path="organizer/attendance/check-in" element={<CheckInPage />} />
                    <Route path="organizer/announcements" element={<AnnouncementListPage role="ORGANIZER" />} />
                    <Route path="organizer/announcements/:id" element={<AnnouncementDetailPage />} />
                    <Route path="organizer/announcements/create" element={<AnnouncementCreatePage />} />
                    <Route path="organizer/announcements/:id/edit" element={<AnnouncementEditPage />} />
                    <Route path="organizer/reviews" element={<ReviewListPage role="ORGANIZER" />} />
                    <Route path="organizer/reviews/:id" element={<ReviewDetailPage />} />
                    <Route path="organizer/reviews/create" element={<ReviewCreatePage />} />
                    <Route path="organizer/reviews/:id/edit" element={<ReviewEditPage />} />
                    <Route path="organizer/badges" element={<BadgeListPage role="ORGANIZER" />} />
                    <Route path="organizer/badges/:id" element={<BadgeDetailPage />} />
                    <Route path="organizer/analytics" element={<AnalyticsDashboard />} />
                    <Route path="organizer/leaderboard" element={<LeaderboardPage />} />
                    <Route path="organizer/event-requests" element={<EventRequestListPage role="ORGANIZER" />} />
                    <Route path="organizer/event-requests/:id" element={<EventRequestDetailPage />} />
                    <Route path="organizer/event-requests/:id/edit" element={<EventRequestEditPage />} />
                    <Route path="organizer/calendar" element={<CalendarPage />} />
                    <Route path="organizer/*" element={<OrganizerDashboard />} />
                  </>
                )}
                
                {/* Volunteer Routes */}
                {(user?.role === 'VOLUNTEER' || !user?.role) && (
                  <>
                    <Route path="volunteer" element={<VolunteerDashboard />} />
                    <Route path="volunteer/events" element={<EventListPage role="VOLUNTEER" />} />
                    <Route path="volunteer/events/:id" element={<EventDetailPage />} />
                    <Route path="volunteer/applications" element={<ApplicationListPage role="VOLUNTEER" />} />
                    <Route path="volunteer/applications/:id" element={<ApplicationDetailPage />} />
                    <Route path="volunteer/applications/create" element={<ApplicationCreatePage />} />
                    <Route path="volunteer/tasks" element={<TaskListPage role="VOLUNTEER" />} />
                    <Route path="volunteer/tasks/:id" element={<TaskDetailPage />} />
                    <Route path="volunteer/shifts" element={<ShiftListPage role="VOLUNTEER" />} />
                    <Route path="volunteer/shifts/:id" element={<ShiftDetailPage />} />
                    <Route path="volunteer/attendance" element={<AttendanceListPage role="VOLUNTEER" />} />
                    <Route path="volunteer/attendance/:id" element={<AttendanceDetailPage />} />
                    <Route path="volunteer/announcements" element={<AnnouncementListPage role="VOLUNTEER" />} />
                    <Route path="volunteer/announcements/:id" element={<AnnouncementDetailPage />} />
                    <Route path="volunteer/reviews" element={<ReviewListPage role="VOLUNTEER" />} />
                    <Route path="volunteer/reviews/:id" element={<ReviewDetailPage />} />
                    <Route path="volunteer/badges" element={<BadgeListPage role="VOLUNTEER" />} />
                    <Route path="volunteer/badges/:id" element={<BadgeDetailPage />} />
                    <Route path="volunteer/event-requests" element={<EventRequestListPage role="VOLUNTEER" />} />
                    <Route path="volunteer/event-requests/create" element={<EventRequestPage />} />
                    <Route path="volunteer/event-requests/:id" element={<EventRequestDetailPage />} />
                    <Route path="volunteer/calendar" element={<CalendarPage />} />
                    <Route path="volunteer/*" element={<VolunteerDashboard />} />
                  </>
                )}
              </Route>
            )}

            {/* Event Routes (for authenticated users) */}
            {isAuthenticated && (
              <>
                <Route path="events" element={<EventListPage role={user?.role || 'VOLUNTEER'} />} />
                <Route path="events/:id" element={<EventDetailPage />} />
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <>
                    <Route path="events/create" element={<EventCreatePage />} />
                    <Route path="events/:id/edit" element={<EventEditPage />} />
                  </>
                )}
                
                {/* Application Routes */}
                <Route path="applications" element={<ApplicationListPage role={user?.role || 'VOLUNTEER'} />} />
                <Route path="applications/:id" element={<ApplicationDetailPage />} />
                <Route path="events/:eventId/apply" element={<ApplicationCreatePage />} />
                
                {/* Task Routes */}
                <Route path="tasks" element={<TaskListPage role={user?.role || 'VOLUNTEER'} />} />
                <Route path="tasks/:id" element={<TaskDetailPage />} />
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <>
                    <Route path="tasks/create" element={<TaskCreatePage />} />
                    <Route path="tasks/:id/edit" element={<TaskEditPage />} />
                  </>
                )}
                
                {/* Shift Routes */}
                <Route path="shifts" element={<ShiftListPage role={user?.role || 'VOLUNTEER'} />} />
                <Route path="shifts/:id" element={<ShiftDetailPage />} />
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <>
                    <Route path="shifts/create" element={<ShiftCreatePage />} />
                    <Route path="shifts/:id/edit" element={<ShiftEditPage />} />
                  </>
                )}
                
                {/* Attendance Routes */}
                <Route path="attendance" element={<AttendanceListPage role={user?.role || 'VOLUNTEER'} />} />
                <Route path="attendance/:id" element={<AttendanceDetailPage />} />
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <Route path="attendance/check-in" element={<CheckInPage />} />
                )}
                
                {/* Announcement Routes */}
                <Route path="announcements" element={<AnnouncementListPage role={user?.role || 'VOLUNTEER'} />} />
                <Route path="announcements/:id" element={<AnnouncementDetailPage />} />
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <>
                    <Route path="announcements/create" element={<AnnouncementCreatePage />} />
                    <Route path="announcements/:id/edit" element={<AnnouncementEditPage />} />
                  </>
                )}
                
                {/* Review Routes */}
                <Route path="reviews" element={<ReviewListPage role={user?.role || 'VOLUNTEER'} />} />
                <Route path="reviews/:id" element={<ReviewDetailPage />} />
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <>
                    <Route path="reviews/create" element={<ReviewCreatePage />} />
                    <Route path="reviews/:id/edit" element={<ReviewEditPage />} />
                  </>
                )}
                
                {/* Badge Routes */}
                <Route path="badges" element={<BadgeListPage role={user?.role || 'VOLUNTEER'} />} />
                <Route path="badges/:id" element={<BadgeDetailPage />} />
                {user?.role === 'ADMIN' && (
                  <Route path="badges/:id/edit" element={<BadgeEditPage />} />
                )}
                
                {/* Analytics Routes */}
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <>
                    <Route path="analytics" element={<AnalyticsDashboard />} />
                    <Route path="leaderboard" element={<LeaderboardPage />} />
                  </>
                )}
                
                {/* Profile Routes */}
                <Route path="profile" element={<ProfilePage />} />
                <Route path="profile/edit" element={<ProfileEditPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="notifications" element={<NotificationPage />} />
                
                {/* Calendar Route */}
                <Route path="calendar" element={<CalendarPage />} />
                
                {/* Event Request Routes */}
                <Route path="event-requests" element={<EventRequestListPage role={user?.role || 'VOLUNTEER'} />} />
                <Route path="event-requests/:id" element={<EventRequestDetailPage />} />
                {user?.role === 'VOLUNTEER' && (
                  <Route path="event-requests/create" element={<EventRequestPage />} />
                )}
                {user?.role === 'ADMIN' && (
                  <Route path="event-requests/:id/edit" element={<EventRequestEditPage />} />
                )}
              </>
            )}

            {/* Redirects */}
            <Route
              path="/dashboard"
              element={isAuthenticated ? (
                <Navigate 
                  to={user?.role === 'ADMIN' ? '/dashboard/admin' : 
                       user?.role === 'ORGANIZER' ? '/dashboard/organizer' : 
                       '/dashboard/volunteer'} 
                  replace 
                />
              ) : (
                <Navigate to="/login" replace />
              )}
            />

            {/* 404 Route */}
            <Route path="404" element={<NotFoundPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default App;
