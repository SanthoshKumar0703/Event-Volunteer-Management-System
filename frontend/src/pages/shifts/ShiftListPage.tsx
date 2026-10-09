import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Search, Filter, Plus, Eye, Edit, Trash2, Users, Clock, MapPin, Tag, Repeat } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Shift } from '../../types/shift';

interface ShiftListPageProps {
  role: 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER';
}

const ShiftListPage: React.FC<ShiftListPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '/shifts';
      
      if (role === 'ORGANIZER' && user?._id) {
        url = `/shifts?organizer=${user._id}`;
      } else if (role === 'VOLUNTEER' && user?._id) {
        url = `/shifts?volunteer=${user._id}`;
      }
      
      const response = await apiService.get<{ success: boolean; data: Shift[]; message?: string }>(url);
      
      if (response.success) {
        setShifts(response.data || []);
        setFilteredShifts(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch shifts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shifts');
    } finally {
      setIsLoading(false);
    }
  }, [role, user?._id]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  useEffect(() => {
    // Apply filters
    let filtered = [...shifts];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shift => 
        shift.name.toLowerCase().includes(query) ||
        shift.description?.toLowerCase().includes(query) ||
        shift.shiftId?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(shift => shift.status === statusFilter);
    }
    
    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(shift => {
        const shiftDate = new Date(shift.date).toISOString().split('T')[0];
        return shiftDate === dateFilter;
      });
    }
    
    setFilteredShifts(filtered);
  }, [shifts, searchQuery, statusFilter, dateFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-600';
      case 'FULL':
        return 'bg-yellow-100 text-yellow-600';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-600';
      case 'CANCELLED':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'Open';
      case 'FULL':
        return 'Full';
      case 'CLOSED':
        return 'Closed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleView = (shift: Shift) => {
    navigate(`/shifts/${shift._id}`);
  };

  const handleEdit = (shift: Shift) => {
    navigate(`/shifts/${shift._id}/edit`);
  };

  const handleDelete = async (shift: Shift) => {
    if (window.confirm(`Are you sure you want to delete "${shift.name}"?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/shifts/${shift._id}`
        );
        
        if (response.success) {
          fetchShifts();
        } else {
          setError(response.message || 'Failed to delete shift');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete shift');
      }
    }
  };

  const handleCreate = () => {
    navigate('/shifts/create');
  };

  const statuses = ['OPEN', 'FULL', 'CLOSED', 'CANCELLED'];

  // Get unique dates from shifts
  const getUniqueDates = () => {
    const dates = shifts.map(shift => {
      const date = new Date(shift.date);
      return date.toISOString().split('T')[0];
    });
    return [...new Set(dates)].sort();
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
            Shifts
          </h1>
          <p className="text-gray-500">
            {role === 'ADMIN' ? 'Manage all shifts' : 
             role === 'ORGANIZER' ? 'Manage your event shifts' : 
             'Shifts you are assigned to'}
          </p>
        </div>
        
        {(role === 'ADMIN' || role === 'ORGANIZER') && (
          <Button onClick={handleCreate} className="self-start lg:self-center">
            <Plus className="w-5 h-5" />
            Create Shift
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
              placeholder="Search shifts..."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        /* Shifts Grid */
        <>
          {filteredShifts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Shifts Found</h3>
              <p className="text-gray-500">
                {role === 'VOLUNTEER' 
                  ? 'No shifts are currently assigned to you.'
                  : 'You have not created any shifts yet.'}
              </p>
              
              {(role === 'ADMIN' || role === 'ORGANIZER') && (
                <Button onClick={handleCreate} className="mt-6">
                  <Plus className="w-5 h-5" />
                  Create Your First Shift
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredShifts.map((shift, index) => (
                <motion.div
                  key={shift._id as string || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="p-4 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      {shift.color && (
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: shift.color }} />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shift.status)}`}>
                        {getStatusText(shift.status)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{shift.name}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{shift.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(shift.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{shift.startTime} - {shift.endTime}</span>
                      </div>
                      {shift.isRecurring && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Repeat className="w-4 h-4" />
                          <span>Recurring</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {shift.assignedCount || 0}/{shift.capacity || 0}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(shift)}
                          className="p-1.5"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {(role === 'ADMIN' || role === 'ORGANIZER') && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(shift)}
                              className="p-1.5"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(shift)}
                              className="p-1.5 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
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

export default ShiftListPage;
