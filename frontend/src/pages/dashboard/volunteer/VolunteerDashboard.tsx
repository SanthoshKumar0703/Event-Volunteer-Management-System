import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  Clock, 
  Award, 
  Megaphone,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Heart
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Card, { StatsCard, CardHeader  } from '../../../components/common/Card';
import Badge, { StatusBadge, PriorityBadge  } from '../../../components/common/Badge';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

const VolunteerDashboard: React.FC = () => {
  const { actualTheme } = useTheme();
  const { user } = useAuth();

  // Stats
  const stats = [
    {
      title: 'Total Hours',
      value: '124',
      icon: <Clock className="w-6 h-6" />,
      color: 'primary',
      trend: 12.5,
      trendType: 'up',
    },
    {
      title: 'Events Completed',
      value: '12',
      icon: <Calendar className="w-6 h-6" />,
      color: 'accent',
      trend: 8.3,
      trendType: 'up',
    },
    {
      title: 'Tasks Completed',
      value: '47',
      icon: <CheckSquare className="w-6 h-6" />,
      color: 'success',
      trend: 15.7,
      trendType: 'up',
    },
    {
      title: 'Badges Earned',
      value: '8',
      icon: <Award className="w-6 h-6" />,
      color: 'secondary',
      trend: 2.1,
      trendType: 'up',
    },
  ];

  // Upcoming Events
  const upcomingEvents = [
    {
      id: 'EVT-001',
      title: 'Annual Charity Gala 2024',
      date: 'December 15, 2024',
      time: '6:00 PM - 10:00 PM',
      location: 'Grand Convention Center',
      role: 'Registration',
      status: 'CONFIRMED',
      organizer: 'Hope Foundation',
    },
    {
      id: 'EVT-002',
      title: 'Community Cleanup Day',
      date: 'October 10, 2024',
      time: '9:00 AM - 1:00 PM',
      location: 'City Park',
      role: 'Crowd Management',
      status: 'CONFIRMED',
      organizer: 'Green Earth',
    },
    {
      id: 'EVT-003',
      title: 'Tech Conference',
      date: 'November 20, 2024',
      time: '9:00 AM - 5:00 PM',
      location: 'Tech Hub Arena',
      role: 'Technical Support',
      status: 'PENDING',
      organizer: 'Innovate Inc.',
    },
  ];

  // Recent Tasks
  const recentTasks = [
    {
      id: 'TASK-001',
      title: 'Set up registration desk',
      event: 'Annual Charity Gala 2024',
      priority: 'HIGH',
      status: 'ASSIGNED',
      dueDate: 'December 14, 2024',
      dueTime: '4:00 PM',
    },
    {
      id: 'TASK-002',
      title: 'Prepare welcome packets',
      event: 'Annual Charity Gala 2024',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      dueDate: 'December 14, 2024',
      dueTime: '5:00 PM',
    },
    {
      id: 'TASK-003',
      title: 'Coordinate volunteer check-in',
      event: 'Community Cleanup Day',
      priority: 'HIGH',
      status: 'ASSIGNED',
      dueDate: 'October 10, 2024',
      dueTime: '8:30 AM',
    },
  ];

  // Recent Announcements
  const announcements = [
    {
      id: 'ANN-001',
      title: 'Important Update: Charity Gala Schedule',
      event: 'Annual Charity Gala 2024',
      message: 'Please arrive 30 minutes early for setup.',
      priority: 'HIGH',
      date: '2 days ago',
      isRead: false,
    },
    {
      id: 'ANN-002',
      title: 'Volunteer Appreciation Event',
      event: 'All Events',
      message: 'Join us for a special appreciation event on November 1st.',
      priority: 'MEDIUM',
      date: '1 week ago',
      isRead: true,
    },
    {
      id: 'ANN-003',
      title: 'New Task Assigned',
      event: 'Community Cleanup Day',
      message: 'You have been assigned to coordinate volunteer check-in.',
      priority: 'HIGH',
      date: '2 weeks ago',
      isRead: true,
    },
  ];

  // Badges
  const badges = [
    { id: 'BADGE-001', name: 'First Event', category: 'PARTICIPATION', earnedAt: '2 months ago' },
    { id: 'BADGE-002', name: 'Quick Responder', category: 'ACHIEVEMENT', earnedAt: '1 month ago' },
    { id: 'BADGE-003', name: 'Perfect Attendance', category: 'PARTICIPATION', earnedAt: '2 weeks ago' },
    { id: 'BADGE-004', name: 'Team Player', category: 'PERFORMANCE', earnedAt: '1 week ago' },
    { id: 'BADGE-005', name: '10 Events Completed', category: 'PARTICIPATION', earnedAt: '3 days ago' },
  ];

  // Quick Actions
  const quickActions = [
    {
      title: 'Discover Events',
      description: 'Find new volunteer opportunities',
      icon: <Calendar className="w-6 h-6" />,
      color: 'primary',
      href: '/dashboard/volunteer/discover',
    },
    {
      title: 'View Applications',
      description: 'Check your application status',
      icon: <CheckSquare className="w-6 h-6" />,
      color: 'accent',
      href: '/dashboard/volunteer/applications',
    },
    {
      title: 'My Tasks',
      description: 'View and complete assigned tasks',
      icon: <CheckSquare className="w-6 h-6" />,
      color: 'success',
      href: '/dashboard/volunteer/tasks',
    },
    {
      title: 'Profile',
      description: 'Update your profile and skills',
      icon: <Users className="w-6 h-6" />,
      color: 'secondary',
      href: '/dashboard/volunteer/profile',
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
          Welcome back, {user?.firstName || 'Volunteer'}! 👋
        </h1>
        <p className="mt-2 text-muted">
          Here's your volunteer dashboard. Track your events, tasks, and impact.
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
        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card variant="elevated" size="xl">
            <CardHeader
              title="Upcoming Events"
              description="Your confirmed and pending event assignments"
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/volunteer/events'}
                >
                  View All
                </Button>
              }
            />
            
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/volunteer/events/${event.id}`}
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
                      <p className="text-sm text-muted">{event.organizer}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {event.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Badge variant="primary" size="xs">
                          {event.role}
                        </Badge>
                        <span className="text-xs text-muted ml-2">{event.location}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card variant="elevated" size="xl">
            <CardHeader
              title="Recent Tasks"
              description="Your assigned and in-progress tasks"
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/volunteer/tasks'}
                >
                  View All
                </Button>
              }
            />
            
            <div className="space-y-4">
              {recentTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/volunteer/tasks/${task.id}`}
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
                      <p className="text-sm text-muted">{task.event}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={task.status} size="xs" />
                        <span className="text-xs text-muted">Due: {task.dueDate} at {task.dueTime}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Announcements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card variant="elevated" size="xl">
          <CardHeader
            title="Recent Announcements"
            description="Important updates from event organizers"
            actions={
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.location.href = '/dashboard/volunteer/announcements'}
              >
                View All
              </Button>
            }
          />
          
          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-4 rounded-xl transition-colors cursor-pointer ${
                  !announcement.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'hover:bg-surface-secondary'
                }`}
                onClick={() => window.location.href = `/dashboard/volunteer/announcements/${announcement.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-5 h-5 text-secondary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-primary truncate">{announcement.title}</h3>
                      <PriorityBadge priority={announcement.priority} size="xs" />
                      {!announcement.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted truncate">{announcement.message}</p>
                    <div className="mt-2">
                      <span className="text-xs text-muted">{announcement.event}</span>
                      <span className="text-xs text-muted mx-2">•</span>
                      <span className="text-xs text-muted">{announcement.date}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Badges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card variant="elevated" size="xl">
          <CardHeader
            title="My Badges"
            description="Achievements and recognition for your contributions"
            actions={
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.location.href = '/dashboard/volunteer/badges'}
              >
                View All
              </Button>
            }
          />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="text-center p-4"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary-400 via-secondary-500 to-accent-500 flex items-center justify-center mb-3">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-primary truncate">{badge.name}</h3>
                <Badge variant="primary" size="xs" className="mt-1">
                  {badge.category}
                </Badge>
                <p className="text-xs text-muted mt-1">{badge.earnedAt}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default VolunteerDashboard;
