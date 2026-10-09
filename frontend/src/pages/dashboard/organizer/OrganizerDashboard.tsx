import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Megaphone,
  ArrowRight,
  Plus,
  FileText,
  Bell,
  BarChart3
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Card, { StatsCard, CardHeader  } from '../../../components/common/Card';
import Badge, { StatusBadge, PriorityBadge  } from '../../../components/common/Badge';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

const OrganizerDashboard: React.FC = () => {
  const { actualTheme } = useTheme();
  const { user } = useAuth();

  // Stats
  const stats = [
    {
      title: 'My Events',
      value: '8',
      icon: <Calendar className="w-6 h-6" />,
      color: 'primary',
      trend: 2,
      trendType: 'up',
    },
    {
      title: 'Total Volunteers',
      value: '124',
      icon: <Users className="w-6 h-6" />,
      color: 'accent',
      trend: 15.7,
      trendType: 'up',
    },
    {
      title: 'Applications',
      value: '47',
      icon: <FileText className="w-6 h-6" />,
      color: 'success',
      trend: 8.3,
      trendType: 'up',
    },
    {
      title: 'Tasks Completed',
      value: '89%',
      icon: <CheckSquare className="w-6 h-6" />,
      color: 'secondary',
      trend: -2.1,
      trendType: 'down',
    },
  ];

  // My Events
  const myEvents = [
    {
      id: 'EVT-001',
      title: 'Annual Charity Gala 2024',
      date: 'December 15, 2024',
      status: 'UPCOMING',
      volunteers: { applied: 24, approved: 18, assigned: 15 },
      tasks: { total: 32, completed: 28 },
      location: 'Grand Convention Center',
    },
    {
      id: 'EVT-002',
      title: 'Community Cleanup Day',
      date: 'October 10, 2024',
      status: 'LIVE',
      volunteers: { applied: 35, approved: 25, assigned: 22 },
      tasks: { total: 45, completed: 40 },
      location: 'City Park',
    },
    {
      id: 'EVT-003',
      title: 'Tech Conference',
      date: 'November 20, 2024',
      status: 'PLANNING',
      volunteers: { applied: 12, approved: 8, assigned: 5 },
      tasks: { total: 56, completed: 12 },
      location: 'Tech Hub Arena',
    },
  ];

  // Recent Applications
  const recentApplications = [
    {
      id: 'APP-001',
      event: 'Annual Charity Gala 2024',
      volunteer: 'Sarah Johnson',
      role: 'Registration',
      matchScore: 94,
      status: 'PENDING',
      appliedDate: '2 days ago',
    },
    {
      id: 'APP-002',
      event: 'Community Cleanup Day',
      volunteer: 'Michael Chen',
      role: 'Crowd Management',
      matchScore: 87,
      status: 'APPROVED',
      appliedDate: '1 week ago',
    },
    {
      id: 'APP-003',
      event: 'Tech Conference',
      volunteer: 'Emily Rodriguez',
      role: 'Technical Support',
      matchScore: 92,
      status: 'APPROVED',
      appliedDate: '2 weeks ago',
    },
    {
      id: 'APP-004',
      event: 'Annual Charity Gala 2024',
      volunteer: 'David Wilson',
      role: 'Hospitality',
      matchScore: 76,
      status: 'REJECTED',
      appliedDate: '3 weeks ago',
    },
  ];

  // Recent Tasks
  const recentTasks = [
    {
      id: 'TASK-001',
      title: 'Finalize event schedule',
      volunteer: 'Sarah Johnson',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: 'December 10, 2024',
    },
    {
      id: 'TASK-002',
      title: 'Confirm vendor bookings',
      volunteer: 'Michael Chen',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      dueDate: 'December 8, 2024',
    },
    {
      id: 'TASK-003',
      title: 'Create volunteer schedule',
      volunteer: 'Emily Rodriguez',
      priority: 'HIGH',
      status: 'ASSIGNED',
      dueDate: 'December 12, 2024',
    },
  ];

  // Quick Actions
  const quickActions = [
    {
      title: 'Create Event',
      description: 'Create a new event',
      icon: <Plus className="w-6 h-6" />,
      color: 'primary',
      href: '/dashboard/organizer/events/new',
    },
    {
      title: 'View All Events',
      description: 'Manage your events',
      icon: <Calendar className="w-6 h-6" />,
      color: 'accent',
      href: '/dashboard/organizer/events',
    },
    {
      title: 'Review Applications',
      description: 'Review volunteer applications',
      icon: <FileText className="w-6 h-6" />,
      color: 'success',
      href: '/dashboard/organizer/applications',
    },
    {
      title: 'Create Announcement',
      description: 'Send announcement to volunteers',
      icon: <Megaphone className="w-6 h-6" />,
      color: 'secondary',
      href: '/dashboard/organizer/announcements/new',
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
          Welcome back, {user?.firstName || 'Organizer'}! 👋
        </h1>
        <p className="mt-2 text-muted">
          Here's your event operations command center.
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
        {/* My Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card variant="elevated" size="xl">
            <CardHeader
              title="My Events"
              description="Events you're organizing"
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/organizer/events'}
                >
                  View All
                </Button>
              }
            />
            
            <div className="space-y-4">
              {myEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/organizer/events/${event.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-primary truncate">{event.title}</h3>
                        <StatusBadge status={event.status} size="xs" />
                      </div>
                      <p className="text-sm text-muted">{event.location}</p>
                      <div className="mt-2">
                        <span className="text-sm text-primary font-medium">{event.date}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted" />
                          <span className="text-xs text-muted">
                            {event.volunteers.applied} applied • {event.volunteers.approved} approved • {event.volunteers.assigned} assigned
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckSquare className="w-4 h-4 text-muted" />
                          <span className="text-xs text-muted">
                            {event.tasks.completed}/{event.tasks.total} tasks
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card variant="elevated" size="xl">
            <CardHeader
              title="Recent Applications"
              description="Volunteer applications for your events"
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/organizer/applications'}
                >
                  View All
                </Button>
              }
            />
            
            <div className="space-y-4">
              {recentApplications.map((application, index) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/organizer/applications/${application.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {application.volunteer.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-primary truncate">{application.volunteer}</h3>
                        <StatusBadge status={application.status} size="xs" />
                      </div>
                      <p className="text-sm text-muted">{application.event}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <Badge variant="primary" size="xs">
                          {application.role}
                        </Badge>
                        <span className="text-muted">
                          Match: {application.matchScore}%
                        </span>
                        <span className="text-muted">
                          Applied: {application.appliedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card variant="elevated" size="xl">
          <CardHeader
            title="Recent Tasks"
            description="Tasks assigned to your volunteers"
            actions={
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.location.href = '/dashboard/organizer/tasks'}
              >
                View All
              </Button>
            }
          />
          
          <div className="space-y-4">
            {recentTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-4 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
                onClick={() => window.location.href = `/dashboard/organizer/tasks/${task.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="w-5 h-5 text-accent-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-primary truncate">{task.title}</h3>
                      <PriorityBadge priority={task.priority} size="xs" />
                    </div>
                    <p className="text-sm text-muted">Assigned to: {task.volunteer}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={task.status} size="xs" />
                      <span className="text-xs text-muted">Due: {task.dueDate}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default OrganizerDashboard;
