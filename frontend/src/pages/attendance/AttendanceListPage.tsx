import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Search, Filter, Plus, Eye, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Attendance, AttendanceStatus } from '../../types/attendance';

interface AttendanceListPageProps {
  role: 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER';
}

const AttendanceListPage: React.FC<AttendanceListPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchAttendances = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '/attendance';
      
      if (role === 'ORGANIZER' && user?._id) {
        url = `/attendance?organizer=${user._id}`;
      } else if (role === 'VOLUNTEER' && user?._id) {
        url = `/attendance?volunteer=${user._id}`;
      }
      
      const response = await apiService.get<{ success: boolean; data: Attendance[]; message?: string }>(url);
      
      if (response.success) {
        setAttendances(response.data || []);
        setFilteredAttendances(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch attendance records');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance records');
    } finally {
      setIsLoading(false);
    }
  }, [role, user?._id]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  useEffect(() => {
    // Apply filters
    let filtered = [...attendances];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(attendance => 
        (attendance.volunteer as any)?.name?.toLowerCase().includes(query) ||
        (attendance.attendanceId?.toLowerCase().includes(query))
      );
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(attendance => attendance.status === statusFilter as AttendanceStatus);
    }
    
    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(attendance => {
        const checkInDate = attendance.checkInTime ? new Date(attendance.checkInTime).toISOString().split('T')[0] : '';
        return checkInDate === dateFilter;
      });
    }
    
    setFilteredAttendances(filtered);
  }, [attendances, searchQuery, statusFilter, dateFilter]);

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'REGISTERED':
        return 'bg-blue-100 text-blue-600';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-600';
      case 'CHECKED_IN':
        return 'bg-tangerine-100 text-tangerine-600';
      case 'CHECKED_OUT':
        return 'bg-orchid-100 text-orchid-600';
      case 'NO_SHOW':
        return 'bg-red-100 text-red-600';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: AttendanceStatus) => {
    switch (status) {
      case 'REGISTERED':
        return 'Registered';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'CHECKED_IN':
        return 'Checked In';
      case 'CHECKED_OUT':
        return 'Checked Out';
      case 'NO_SHOW':
        return 'No Show';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleView = (attendance: Attendance) => {
    navigate(`/attendance/${attendance._id}`);
  };

  const handleCheckIn = () => {
    navigate('/attendance/check-in');
  };

  const statuses: AttendanceStatus[] = [
    'REGISTERED', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW', 'CANCELLED'
  ];

  // Get unique dates from attendances
  const getUniqueDates = () => {
    const dates = attendances.map(attendance => {
      if (attendance.checkInTime) {
        const date = new Date(attendance.checkInTime);
        return date.toISOString().split('T')[0];
      }
      return '';
    });
    return [...new Set(dates.filter(d => d))].sort();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent mb-2">
            Attendance
          </h1>
          <p className="text-gray-500">
            {role === 'ADMIN' ? 'Manage all attendance records' : 
             role === 'ORGANIZER' ? 'Manage your event attendance' : 
             'Your attendance history'}
          </p>
        </div>
        
        {(role === 'ADMIN' || role === 'ORGANIZER') && (
          <Button onClick={handleCheckIn} className="self-start lg:self-center">
            <CheckCircle className="w-5 h-5" />
            Check In
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search attendance records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none transition-colors"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filters
          </Button>
        </div>
        
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-gray-100"
          >
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{getStatusText(status)}</option>
              ))}
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
            >
              <option value="">All Dates</option>
              {getUniqueDates().map(date => (
                <option key={date} value={date}>{new Date(date).toLocaleDateString()}</option>
              ))}
            </select>
            
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('');
                setDateFilter('');
                setSearchQuery('');
              }}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        /* Attendance List */
        <>
          {filteredAttendances.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Attendance Records Found</h3>
              <p className="text-gray-500">
                {role === 'VOLUNTEER' 
                  ? 'You have no attendance records yet.'
                  : 'No attendance records found for your events.'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredAttendances.map((attendance, index) => (
                <motion.div
                  key={attendance._id as string || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-tangerine-100 rounded-full flex items-center justify-center">
                            <span className="text-tangerine-600 font-medium">
                              {(attendance.volunteer as any)?.firstName?.charAt(0) || 'V'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {(attendance.volunteer as any)?.name || (attendance.volunteer as any)?.firstName || 'Volunteer'}
                            </h3>
                            <p className="text-gray-500 text-sm">
                              {(attendance.event as any)?.title || (attendance.event as any)?._id || 'Event'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {attendance.checkInTime && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>Checked in: {new Date(attendance.checkInTime).toLocaleString()}</span>
                            </div>
                          )}
                          {attendance.checkOutTime && (
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-orchid-500" />
                              <span>Checked out: {new Date(attendance.checkOutTime).toLocaleString()}</span>
                            </div>
                          )}
                          {attendance.totalHours && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-tangerine-500" />
                              <span>{attendance.totalHours} hours</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(attendance.status)}`}>
                          {getStatusText(attendance.status)}
                        </span>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(attendance)}
                          className="p-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default AttendanceListPage;
