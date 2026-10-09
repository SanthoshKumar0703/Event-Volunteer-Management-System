import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, LineChart, Users, Calendar, Clock, Award, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';

interface AnalyticsData {
  totalEvents: number;
  totalVolunteers: number;
  totalHours: number;
  totalTasks: number;
  totalApplications: number;
  totalShifts: number;
  eventStats: {
    DRAFT: number;
    PENDING: number;
    OPEN_FOR_REGISTRATION: number;
    UPCOMING: number;
    LIVE: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  volunteerStats: {
    active: number;
    pending: number;
    inactive: number;
  };
  monthlyData: {
    month: string;
    events: number;
    volunteers: number;
    hours: number;
  }[];
}

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let url = '/analytics';
        if (user?.role === 'ORGANIZER') {
          url = `/analytics?organizer=${user._id}`;
        }
        
        const response = await apiService.get<{ success: boolean; data: AnalyticsData; message?: string }>(url);
        
        if (response.success) {
          setAnalytics(response.data);
        } else {
          setError(response.message || 'Failed to fetch analytics');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [user, timeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500';
      case 'LIVE':
      case 'UPCOMING':
        return 'bg-tangerine-500';
      case 'OPEN_FOR_REGISTRATION':
        return 'bg-blue-500';
      case 'DRAFT':
      case 'PENDING':
        return 'bg-gray-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <div className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </motion.div>
    );
  }

  if (!analytics) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">No Analytics Data Available</h3>
        </Card>
      </motion.div>
    );
  }

  // Calculate percentages
  const totalEvents = Object.values(analytics.eventStats).reduce((sum, count) => sum + count, 0);
  const volunteerTotal = Object.values(analytics.volunteerStats).reduce((sum, count) => sum + count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-gray-500">Get insights into your event management performance</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTimeRange('week')}
          className={`px-4 py-2 rounded-lg ${timeRange === 'week' ? 'bg-tangerine-500 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Last Week
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={`px-4 py-2 rounded-lg ${timeRange === 'month' ? 'bg-tangerine-500 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Last Month
        </button>
        <button
          onClick={() => setTimeRange('year')}
          className={`px-4 py-2 rounded-lg ${timeRange === 'year' ? 'bg-tangerine-500 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Last Year
        </button>
        <button
          onClick={() => setTimeRange('all')}
          className={`px-4 py-2 rounded-lg ${timeRange === 'all' ? 'bg-tangerine-500 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          All Time
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-tangerine-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-tangerine-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Events</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalEvents}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orchid-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-orchid-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Volunteers</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalVolunteers}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Hours</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalHours}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalTasks}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Event Status Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Event Status Distribution</h2>
            <PieChart className="w-6 h-6 text-gray-500" />
          </div>
          <div className="space-y-3">
            {Object.entries(analytics.eventStats).map(([status, count]) => (
              count > 0 && (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getStatusColor(status) }} />
                  <span className="flex-1 text-gray-700">{status.replace('_', ' ')}</span>
                  <span className="text-gray-800 font-medium">{count}</span>
                  <span className="text-gray-500 text-sm">({((count / totalEvents) * 100).toFixed(1)}%)</span>
                </div>
              )
            ))}
          </div>
        </Card>
        
        {/* Volunteer Status Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Volunteer Status Distribution</h2>
            <Users className="w-6 h-6 text-gray-500" />
          </div>
          <div className="space-y-3">
            {Object.entries(analytics.volunteerStats).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-tangerine-100" />
                <span className="flex-1 text-gray-700">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <span className="text-gray-800 font-medium">{count}</span>
                <span className="text-gray-500 text-sm">({((count / volunteerTotal) * 100).toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Monthly Trends</h2>
          <LineChart className="w-6 h-6 text-gray-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-gray-500 text-sm font-medium">Month</th>
                <th className="text-left py-3 text-gray-500 text-sm font-medium">Events</th>
                <th className="text-left py-3 text-gray-500 text-sm font-medium">Volunteers</th>
                <th className="text-left py-3 text-gray-500 text-sm font-medium">Hours</th>
              </tr>
            </thead>
            <tbody>
              {analytics.monthlyData.map((data, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 text-gray-800">{data.month}</td>
                  <td className="py-3 text-gray-800">{data.events}</td>
                  <td className="py-3 text-gray-800">{data.volunteers}</td>
                  <td className="py-3 text-gray-800">{data.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-tangerine-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-tangerine-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Applications</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalApplications}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orchid-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orchid-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Shifts</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalShifts}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Avg. Rating</p>
              <p className="text-2xl font-bold text-gray-800">4.5</p>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default AnalyticsDashboard;
