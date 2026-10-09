import React, { ReactNode, useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  Bell, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Megaphone,
  QrCode,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../common/Button';
import Badge, { NotificationBadge, AvatarBadge  } from '../common/Badge';
import { EventFlowLogo } from '../common/LoadingScreen';

interface OrganizerLayoutProps {
  children?: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
  children?: NavItem[];
}

const OrganizerLayout: React.FC<OrganizerLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, actualTheme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location]);

  // Navigation items
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard/organizer',
      icon: <Home className="w-5 h-5" />,
    },
    {
      label: 'My Events',
      href: '/dashboard/organizer/events',
      icon: <Calendar className="w-5 h-5" />,
      badge: 3,
    },
    {
      label: 'Volunteers',
      href: '/dashboard/organizer/volunteers',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'Applications',
      href: '/dashboard/organizer/applications',
      icon: <FileText className="w-5 h-5" />,
      badge: 8,
    },
    {
      label: 'Tasks',
      href: '/dashboard/organizer/tasks',
      icon: <ClipboardList className="w-5 h-5" />,
      badge: 5,
    },
    {
      label: 'Shifts',
      href: '/dashboard/organizer/shifts',
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      label: 'Attendance',
      href: '/dashboard/organizer/attendance',
      icon: <QrCode className="w-5 h-5" />,
    },
    {
      label: 'Announcements',
      href: '/dashboard/organizer/announcements',
      icon: <Megaphone className="w-5 h-5" />,
      badge: 2,
    },
    {
      label: 'Analytics',
      href: '/dashboard/organizer/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: 'Messages',
      href: '/dashboard/organizer/messages',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      label: 'Notifications',
      href: '/dashboard/organizer/notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadCount,
    },
    {
      label: 'Settings',
      href: '/dashboard/organizer/settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  // Toggle sidebar
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Active link check
  const isActive = (href: string): boolean => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Sidebar
  const Sidebar = () => (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 bg-surface border-r border-border-light dark:border-border-medium',
        isSidebarOpen ? 'w-64' : 'w-0',
        'hidden lg:block'
      )}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border-light dark:border-border-medium">
        {isSidebarOpen && (
          <>
            <EventFlowLogo />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="w-8 h-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Sidebar Navigation */}
      {isSidebarOpen && (
        <div className="p-4">
          {/* User Profile */}
          <div className="mb-8">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <AvatarBadge
                name={user?.fullName || 'Organizer'}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary truncate">{user?.fullName || 'Organizer'}</p>
                <p className="text-xs text-muted truncate">{user?.email || 'organizer@eventflow.app'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <motion.div
                key={item.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive(item.href) 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-medium' 
                      : 'text-muted hover:bg-surface-secondary hover:text-primary'
                  )}
                >
                  <span className={cn(
                    isActive(item.href) ? 'text-primary' : 'text-muted'
                  )}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <NotificationBadge count={item.badge} size="xs" />
                  )}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="mt-8 pt-6 border-t border-border-light dark:border-border-medium">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-4 h-4" />}
              fullWidth
              className="justify-start"
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );

  // Mobile Sidebar
  const MobileSidebar = () => (
    <AnimatePresence>
      {isMobileSidebarOpen && (
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={toggleMobileSidebar}
          />

          {/* Sidebar */}
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-surface shadow-xl">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border-light dark:border-border-medium">
              <EventFlowLogo />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileSidebar}
                className="w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4">
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={toggleMobileSidebar}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                      isActive(item.href) 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-medium' 
                        : 'text-muted hover:bg-surface-secondary hover:text-primary'
                    )}
                  >
                    <span className={cn(
                      isActive(item.href) ? 'text-primary' : 'text-muted'
                    )}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <NotificationBadge count={item.badge} size="xs" />
                    )}
                  </Link>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-border-light dark:border-border-medium">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={<LogOut className="w-4 h-4" />}
                  fullWidth
                  className="justify-start"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Header
  const Header = () => (
    <header className="sticky top-0 z-30 h-16 bg-surface border-b border-border-light dark:border-border-medium">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileSidebar}
            className="lg:hidden w-8 h-8 p-0"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="hidden lg:flex w-8 h-8 p-0"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted">
            <Home className="w-4 h-4" />
            <span>/</span>
            <span className="font-medium text-primary">Organizer Dashboard</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-8 h-8 p-0"
          >
            {actualTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 relative"
            onClick={() => navigate('/dashboard/organizer/notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <NotificationBadge
                count={unreadCount}
                size="xs"
                className="absolute -top-1 -right-1"
              />
            )}
          </Button>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <AvatarBadge
              name={user?.fullName || 'Organizer'}
              size="sm"
            />
            <div className="hidden sm:block">
              <p className="font-medium text-primary">{user?.fullName || 'Organizer'}</p>
              <p className="text-xs text-muted">Organizer</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-primary">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 min-h-screen',
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 sm:p-6 lg:p-8"
        >
          {children || <Outlet />}
        </motion.div>
      </main>
    </div>
  );
};

// Helper component for links
const Link: React.FC<{
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ to, children, className, onClick }) => {
  const navigate = useNavigate();
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
    onClick?.();
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

export default OrganizerLayout;
