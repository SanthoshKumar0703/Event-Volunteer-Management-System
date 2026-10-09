import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  Bell, 
  BarChart3, 
  Heart,
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  Award
} from 'lucide-react';
import Button from '../components/common/Button';
import Card, { FeatureCard, StatsCard  } from '../components/common/Card';
import Badge from '../components/common/Badge';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const LandingPage: React.FC = () => {
  const { actualTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  // Stats
  const stats = [
    { title: 'Events Managed', value: '10,000+', icon: <Calendar className="w-6 h-6" />, color: 'primary' },
    { title: 'Volunteers Connected', value: '50,000+', icon: <Users className="w-6 h-6" />, color: 'accent' },
    { title: 'Tasks Completed', value: '100,000+', icon: <CheckSquare className="w-6 h-6" />, color: 'success' },
    { title: 'Hours Volunteered', value: '500,000+', icon: <Clock className="w-6 h-6" />, color: 'secondary' },
  ];

  // Features
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Realtime Coordination',
      description: 'Instant notifications and updates keep everyone in sync during live events.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Smart Matching',
      description: 'AI-powered volunteer matching based on skills, availability, and experience.',
    },
    {
      icon: <CheckSquare className="w-6 h-6" />,
      title: 'Task Management',
      description: 'Create, assign, and track tasks with ease. Volunteers can start and complete tasks in realtime.',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Notifications',
      description: 'Get instant updates via email, push notifications, and in-app alerts.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics',
      description: 'Track performance, attendance, and impact with detailed analytics dashboards.',
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Gamification',
      description: 'Reward volunteers with badges and recognition for their contributions.',
    },
  ];

  // How it works steps
  const steps = [
    {
      step: 1,
      title: 'Submit Event Request',
      description: 'Organizations submit event requests with all the details.',
      icon: <Calendar className="w-8 h-8" />,
    },
    {
      step: 2,
      title: 'Admin Review & Approval',
      description: 'Admins review and approve requests, assigning organizers.',
      icon: <CheckSquare className="w-8 h-8" />,
    },
    {
      step: 3,
      title: 'Volunteer Discovery',
      description: 'Volunteers discover and apply to events that match their skills.',
      icon: <Users className="w-8 h-8" />,
    },
    {
      step: 4,
      title: 'Smart Matching',
      description: 'Our system matches volunteers to events based on compatibility.',
      icon: <Sparkles className="w-8 h-8" />,
    },
    {
      step: 5,
      title: 'Task Assignment',
      description: 'Organizers assign tasks and shifts to selected volunteers.',
      icon: <Zap className="w-8 h-8" />,
    },
    {
      step: 6,
      title: 'Realtime Execution',
      description: 'Volunteers receive notifications, complete tasks, and check in via QR codes.',
      icon: <Bell className="w-8 h-8" />,
    },
  ];

  // Testimonials
  const testimonials = [
    {
      quote: 'EventFlow has transformed how we manage our annual charity gala. The smart matching system saved us hundreds of hours in volunteer coordination.',
      name: 'Sarah Johnson',
      title: 'Event Director, Hope Foundation',
      avatar: 'SJ',
    },
    {
      quote: 'As a volunteer, I love how easy it is to discover events and apply. The notifications keep me updated, and the task management is super intuitive.',
      name: 'Michael Chen',
      title: 'Volunteer',
      avatar: 'MC',
    },
    {
      quote: 'The analytics dashboard gives us incredible insights into our volunteer program. We can now measure impact and optimize our events like never before.',
      name: 'Emily Rodriguez',
      title: 'Operations Manager, City Events',
      avatar: 'ER',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 z-0">
          <motion.div
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl"
            animate={{ 
              x: [100, -100, 100],
              y: [-100, 100, -100],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent-500/10 blur-3xl"
            animate={{ 
              x: [-100, 100, -100],
              y: [100, -100, 100],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-secondary-500/5 blur-2xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex"
            >
              <Badge
                variant="accentSolid"
                size="lg"
                rounded="full"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Next Generation Event Platform
              </Badge>
            </motion.div>

            {/* Hero Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
            >
              Every Event Runs Better 
              <span className="text-gradient">With the Right People</span>
            </motion.h1>

            {/* Hero Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 max-w-3xl mx-auto text-lg text-muted"
            >
              Plan events, coordinate volunteers, assign work, communicate instantly and measure impact from one intelligent event operations platform.
            </motion.p>

            {/* Hero Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => isAuthenticated ? window.location.href = '/dashboard' : window.location.href = '/register'}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="min-w-[200px]"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="min-w-[200px]"
              >
                How It Works
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-20 h-20 rounded-2xl bg-primary-500/20 flex items-center justify-center"
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Calendar className="w-8 h-8 text-primary-500" />
          </motion.div>
          <motion.div
            className="absolute top-40 right-20 w-16 h-16 rounded-2xl bg-accent-500/20 flex items-center justify-center"
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <Users className="w-6 h-6 text-accent-500" />
          </motion.div>
          <motion.div
            className="absolute bottom-40 left-20 w-14 h-14 rounded-2xl bg-success-500/20 flex items-center justify-center"
            animate={{ 
              y: [0, -10, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <CheckSquare className="w-6 h-6 text-success-500" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8"
          >
            {stats.map((stat, index) => (
              <StatsCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                className="text-center"
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge
              variant="primary"
              size="lg"
              rounded="full"
            >
              Powerful Features
            </Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold">
              Everything You Need for Event Success
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted">
              From volunteer matching to realtime coordination, EventFlow has you covered.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-surface-secondary via-surface to-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge
              variant="accent"
              size="lg"
              rounded="full"
            >
              Simple Process
            </Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold">
              How EventFlow Works
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted">
              From event request to successful execution, our platform streamlines every step.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 via-accent-500 to-secondary-500 hidden lg:block" />

            <div className="space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="flex flex-col lg:flex-row items-start gap-8">
                    {/* Step Number */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                        {step.step}
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <Card variant="elevated" size="lg">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                            {step.icon}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-primary mb-2">
                              {step.title}
                            </h3>
                            <p className="text-muted">{step.description}</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Event Pulse Visualization */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Badge
              variant="secondary"
              size="lg"
              rounded="full"
            >
              Live Event Network
            </Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold">
              Event Pulse
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted">
              Visualize the realtime flow of events, volunteers, and tasks in our intelligent network.
            </p>
          </motion.div>

          {/* Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative h-96 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary rounded-3xl overflow-hidden border border-border-light dark:border-border-medium"
          >
            {/* Animated Elements */}
            <motion.div
              className="absolute top-10 left-10 w-20 h-20 rounded-2xl bg-primary-500/20 flex items-center justify-center"
              animate={{ 
                y: [0, -20, 0],
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Calendar className="w-8 h-8 text-primary-500" />
              <span className="ml-2 text-sm font-medium text-primary-600">Event</span>
            </motion.div>

            <motion.div
              className="absolute top-20 right-20 w-16 h-16 rounded-2xl bg-accent-500/20 flex items-center justify-center"
              animate={{ 
                y: [0, -15, 0],
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <Users className="w-6 h-6 text-accent-500" />
              <span className="ml-2 text-xs font-medium text-accent-600">Volunteers</span>
            </motion.div>

            <motion.div
              className="absolute bottom-20 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-success-500/20 flex items-center justify-center"
              animate={{ 
                y: [0, -10, 0],
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <CheckSquare className="w-6 h-6 text-success-500" />
              <span className="ml-2 text-xs font-medium text-success-600">Tasks</span>
            </motion.div>

            {/* Connection Lines */}
            <motion.svg
              className="absolute inset-0 w-full h-full"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.line
                x1="100" y1="100"
                x2="300" y2="200"
                stroke="url(#gradient1)"
                strokeWidth="2"
                strokeDasharray="0 100"
                animate={{ strokeDashoffset: [100, 0] }}
                transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: 'loop' }}
              />
              <motion.line
                x1="700" y1="100"
                x2="500" y2="300"
                stroke="url(#gradient2)"
                strokeWidth="2"
                strokeDasharray="0 100"
                animate={{ strokeDashoffset: [100, 0] }}
                transition={{ duration: 2, delay: 1.5, repeat: Infinity, repeatType: 'loop' }}
              />
              <motion.line
                x1="400" y1="400"
                x2="600" y2="400"
                stroke="url(#gradient3)"
                strokeWidth="2"
                strokeDasharray="0 100"
                animate={{ strokeDashoffset: [100, 0] }}
                transition={{ duration: 2, delay: 2, repeat: Infinity, repeatType: 'loop' }}
              />
              
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#FF7A33', stopOpacity: 0.6 }} />
                  <stop offset="100%" style={{ stopColor: '#B064FF', stopOpacity: 0.6 }} />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#FFAB33', stopOpacity: 0.6 }} />
                  <stop offset="100%" style={{ stopColor: '#FF7A33', stopOpacity: 0.6 }} />
                </linearGradient>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 0.6 }} />
                  <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
            </motion.svg>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge
              variant="success"
              size="lg"
              rounded="full"
            >
              Loved by Teams
            </Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold">
              What Our Users Say
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted">
              Hear from event organizers and volunteers who love using EventFlow.
            </p>
          </motion.div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card variant="elevated" size="lg" className="h-full">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {testimonial.avatar}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-5 h-5 text-error-500 fill-error-500" />
                        <Heart className="w-5 h-5 text-error-500 fill-error-500" />
                        <Heart className="w-5 h-5 text-error-500 fill-error-500" />
                        <Heart className="w-5 h-5 text-error-500 fill-error-500" />
                        <Heart className="w-5 h-5 text-error-500 fill-error-500" />
                      </div>
                      <p className="text-muted mb-4">
                        "{testimonial.quote}"
                      </p>
                      <div>
                        <p className="font-semibold text-primary">{testimonial.name}</p>
                        <p className="text-sm text-muted">{testimonial.title}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 rounded-3xl p-8 sm:p-12 lg:p-16 text-center overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }} />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <Badge
                variant="light"
                size="lg"
                rounded="full"
                className="mb-4"
              >
                Ready to Get Started?
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Transform Your Event Management Today
              </h2>
              <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
                Join thousands of organizations and volunteers who trust EventFlow to power their events.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="light"
                  size="lg"
                  onClick={() => isAuthenticated ? window.location.href = '/dashboard' : window.location.href = '/register'}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="min-w-[200px]"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="min-w-[200px] border-white/30 text-white hover:bg-white/10"
                >
                  See All Features
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
