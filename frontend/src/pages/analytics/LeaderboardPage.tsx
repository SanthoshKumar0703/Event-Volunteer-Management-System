import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Search, Users, Clock, Award, TrendingUp, Filter } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';

interface LeaderboardEntry {
  rank: number;
  volunteer: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  totalHours: number;
  totalEvents: number;
  totalTasks: number;
  averageRating: number;
  badgesEarned: number;
  lastActive: string;
}

const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'hours' | 'events' | 'rating' | 'tasks' | 'badges'>('hours');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let url = `/analytics/leaderboard?sortBy=${sortBy}&timeRange=${timeRange}`;
        if (user?.role === 'ORGANIZER') {
          url += `&organizer=${user._id}`;
        }
        
        const response = await apiService.get<{ success: boolean; data: LeaderboardEntry[]; message?: string }>(url);
        
        if (response.success) {
          setLeaderboard(response.data || []);
          setFilteredLeaderboard(response.data || []);
        } else {
          setError(response.message || 'Failed to fetch leaderboard');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch leaderboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [user, sortBy, timeRange]);

  useEffect(() => {
    // Apply search filter
    let filtered = [...leaderboard];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.volunteer.name.toLowerCase().includes(query) ||
        entry.volunteer.email.toLowerCase().includes(query)
      );
    }
    
    setFilteredLeaderboard(filtered);
  }, [leaderboard, searchQuery]);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) {
      return <span className="text-2xl text-yellow-500">🥇</span>;
    } else if (rank === 2) {
      return <span className="text-2xl text-gray-400">🥈</span>;
    } else if (rank === 3) {
      return <span className="text-2xl text-orange-500">🥉</span>;
    }
    return <span className="text-xl text-gray-400">#{rank}</span>;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-tangerine-600';
    if (rating >= 2.5) return 'text-orchid-600';
    return 'text-gray-600';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent mb-2">
          Leaderboard
        </h1>
        <p className="text-gray-500">Top performing volunteers</p>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search volunteers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none transition-colors"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
          >
            <option value="hours">Sort by Hours</option>
            <option value="events">Sort by Events</option>
            <option value="rating">Sort by Rating</option>
            <option value="tasks">Sort by Tasks</option>
            <option value="badges">Sort by Badges</option>
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
          >
            <option value="all">All Time</option>
            <option value="year">Last Year</option>
            <option value="month">Last Month</option>
            <option value="week">Last Week</option>
          </select>
        </div>
      </Card>

      {/* Leaderboard */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-gray-500 text-sm font-medium">Rank</th>
                <th className="text-left py-3 text-gray-500 text-sm font-medium">Volunteer</th>
                <th className="text-left py-3 text-gray-500 text-sm font-medium">Hours</th>
                <th className="text-left py-3 text-gray-500 text-sm font-medium">Events</th>
                <th className="text-left py-3 text-gray-500 text-sm font-medium">Tasks</th>
                <th className="text-left py-3 text-gray-500 text-sm font-medium">Rating</th>
                <th className="text-left py-3 text-gray-500 text-sm font-medium">Badges</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.length > 0 ? (
                filteredLeaderboard.map((entry, index) => (
                  <tr
                    key={entry.volunteer._id}
                    className={`border-b border-gray-100 ${index < 3 ? 'bg-gray-50' : ''}`}
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {getMedalIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-tangerine-100 rounded-full flex items-center justify-center">
                          <span className="text-tangerine-600 font-medium">
                            {entry.volunteer.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{entry.volunteer.name}</p>
                          <p className="text-gray-500 text-sm">{entry.volunteer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-800 font-medium">{entry.totalHours}</td>
                    <td className="py-4 text-gray-800 font-medium">{entry.totalEvents}</td>
                    <td className="py-4 text-gray-800 font-medium">{entry.totalTasks}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {renderStars(entry.averageRating)}
                      </div>
                    </td>
                    <td className="py-4 text-gray-800 font-medium">{entry.badgesEarned}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No leaderboard data available</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="p-6 text-center">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">{filteredLeaderboard.length}</p>
          <p className="text-gray-500 text-sm">Total Volunteers</p>
        </Card>
        
        <Card className="p-6 text-center">
          <Clock className="w-8 h-8 text-tangerine-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">
            {filteredLeaderboard.reduce((sum, entry) => sum + entry.totalHours, 0)}
          </p>
          <p className="text-gray-500 text-sm">Total Hours</p>
        </Card>
        
        <Card className="p-6 text-center">
          <Award className="w-8 h-8 text-orchid-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">
            {filteredLeaderboard.reduce((sum, entry) => sum + entry.badgesEarned, 0)}
          </p>
          <p className="text-gray-500 text-sm">Total Badges</p>
        </Card>
      </div>
    </motion.div>
  );
};

export default LeaderboardPage;
