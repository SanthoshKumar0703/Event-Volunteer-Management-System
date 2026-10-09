import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckSquare,
  XSquare,
  ArrowRight,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Card, { StatsCard, CardHeader  } from '../../../components/common/Card';
import Badge, { StatusBadge, PriorityBadge  } from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

const AdminDashboard: React.FC = () => {
  const { actualTheme } = useTheme();
  const { user } = useAuth();

  // Stats
  const stats = [
    {
      title: 'Total Users',
      value: '1,247',
      icon: <Users className="w-6 h-6" />,
      color: 'primary',
      trend: 12.5,
      trendType: 'up',
    },
    {
      title: 'Active Events',
      value: '24',
      icon: <Calendar className="w-6 h-6" />,
      color: 'accent',
      trend: 8.3,
      trendType: 'up',
    },
    {
      title: 'Event Requests',
      value: '8',
      icon: <FileText className="w-6 h-6" />,
      color: 'secondary',
      trend: -2.1,
      trendType: 'down',
    },
    {
      title: 'Volunteers',
      value: '892',
      icon: <CheckSquare className="w-6 h-6" />,
      color: 'success',
      trend: 15.7,
      trendType: 'up',
    },
  ];

  // Recent Event Requests
  const eventRequests = [
    {
      id: 'REQ-001245',
      title: 'Annual Charity Gala 2024',
      organization: 'Hope Foundation',
      date: '2024-12-15',
      status: 'PENDING_REVIEW',
      volunteers: 50,
      contact: 'sarah@hope.org',
    },
    {
      id: 'REQ-001244',
      title: 'Tech Conference 2024',
      organization: 'Innovate Inc.',
      date: '2024-11-20',
      status: 'APPROVED',
      volunteers: 30,
      contact: 'john@innovate.com',
    },
    {
      id: 'REQ-001243',
      title: 'Community Cleanup Day',
      organization: 'Green Earth',
      date: '2024-10-10',
      status: 'ORGANIZER_ASSIGNED',
      volunteers: 25,
      contact: 'emma@greenearth.org',
    },
    {
      id: 'REQ-001242',
      title: 'Music Festival',
      organization: 'Harmony Events',
      date: '2024-09-25',
      status: 'PLANNING',
      volunteers: 100,
      contact: 'mike@harmony.com',
    },
    {
      id: 'REQ-001241',
      title: 'Sports Tournament',
      organization: 'Champions Club',
      date: '2024-08-15',
      status: 'ACTIVE',
      volunteers: 40,
      contact: 'alex@champions.org',
    },
  ];

  // Recent Users
  const recentUsers = [
    {
      id: 'USER-001',
      name: 'Sarah Johnson',
      email: 'sarah@hope.org',
      role: 'ORGANIZER',
      status: 'PENDING',
      joined: '2 days ago',
    },
    {
      id: 'USER-002',
      name: 'Michael Chen',
      email: 'michael@example.com',
      role: 'VOLUNTEER',
      status: 'ACTIVE',
      joined: '1 week ago',
    },
    {
      id: 'USER-003',
      name: 'Emily Rodriguez',
      email: 'emily@innovate.com',
      role: 'ORGANIZER',
      status: 'APPROVED',
      joined: '2 weeks ago',
    },
    {
      id: 'USER-004',
      name: 'David Wilson',
      email: 'david@events.com',
      role: 'VOLUNTEER',
      status: 'ACTIVE',
      joined: '1 month ago',
    },
  ];

  // Quick Actions
  const quickActions = [
    {
      title: 'New Event Request',
      description: 'Submit a new event request',
      icon: <Plus className="w-6 h-6" />,
      color: 'primary',
      href: '/dashboard/admin/event-requests/new',
    },
    {
      title: 'View All Users',
      description: 'Manage platform users',
      icon: <Users className="w-6 h-6" />,
      color: 'accent',
      href: '/dashboard/admin/users',
    },
    {
      title: 'Analytics',
      description: 'View platform analytics',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'success',
      href: '/dashboard/admin/analytics',
    },
    {
      title: 'Notifications',
      description: 'View all notifications',
      icon: <Calendar className="w-6 h-6" />,
      color: 'secondary',
      href: '/dashboard/admin/notifications',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          Welcome back, {user?.firstName || 'Admin'}! 👋
        </h1>
        <p className="mt-2 text-muted">
          Here's what's happening with EventFlow today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            trendType={stat.trendType}
          />
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-primary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={action.title}
              variant="elevated"
              hoverable
              clickable
              className="cursor-pointer transition-transform hover:scale-[1.02]"
              onClick={() => window.location.href = action.href}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${action.color}-500 to-${action.color}-600 flex items-center justify-center`}>
                  {action.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-primary">{action.title}</h3>
                  <p className="text-sm text-muted">{action.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card variant="elevated" size="xl">
            <CardHeader
              title="Recent Event Requests"
              description="Latest event requests submitted to the platform"
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/admin/event-requests'}
                >
                  View All
                </Button>
              }
            />
            
            <div className="space-y-4">
              {eventRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/admin/event-requests/${request.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-primary truncate">{request.title}</h3>
                        <StatusBadge status={request.status} size="xs" />
                      </div>
                      <p className="text-sm text-muted">{request.organization}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {request.volunteers} volunteers
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {request.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card variant="elevated" size="xl">
            <CardHeader
              title="Recent Users"
              description="Newly registered platform users"
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/admin/users'}
                >
                  View All
                </Button>
              }
            />
            
            <div className="space-y-4">
              {recentUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/admin/users/${user.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-primary truncate">{user.name}</h3>
                        <Badge variant={user.role === 'ADMIN' ? 'error' : user.role === 'ORGANIZER' ? 'primary' : 'success'} size="xs">
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusBadge status={user.status} size="xs" />
                        <span className="text-xs text-muted">{user.joined}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card variant="elevated" size="xl">
          <CardHeader
            title="Recent Activity"
            description="Latest actions across the platform"
          />
          
          <div className="space-y-6">
            {/* Activity Item */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium text-primary">Sarah Johnson</span> submitted a new event request 
                  <span className="font-medium text-primary">"Annual Charity Gala 2024"</span>
                </p>
                <p className="text-xs text-muted mt-1">2 hours ago</p>
              </div>
            </motion.div>

            {/* Activity Item */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-success-50 flex items-center justify-center flex-shrink-0">
                <CheckSquare className="w-5 h-5 text-success-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium text-primary">Admin</span> approved event request 
                  <span className="font-medium text-primary">"Tech Conference 2024"</span>
                </p>
                <p className="text-xs text-muted mt-1">5 hours ago</p>
              </div>
            </motion.div>

            {/* Activity Item */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-accent-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium text-primary">Michael Chen</span> applied to volunteer for 
                  <span className="font-medium text-primary">"Community Cleanup Day"</span>
                </p>
                <p className="text-xs text-muted mt-1">1 day ago</p>
              </div>
            </motion.div>

            {/* Activity Item */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-secondary-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-secondary-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium text-primary">System</span> generated monthly analytics report
                </p>
                <p className="text-xs text-muted mt-1">2 days ago</p>
              </div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
