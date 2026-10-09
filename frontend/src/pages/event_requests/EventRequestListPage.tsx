import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Plus, Eye, CheckCircle, XCircle, Calendar, User as UserIcon, Clock } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { EventRequest, EventRequestStatus } from '../../types/eventRequest';

interface EventRequestListPageProps {
  role: 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER';
}

const EventRequestListPage: React.FC<EventRequestListPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<EventRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '/event-requests';
      
      if (role === 'ORGANIZER' && user?._id) {
        url = `/event-requests?organizer=${user._id}`;
      } else if (role === 'VOLUNTEER' && user?._id) {
        url = `/event-requests?volunteer=${user._id}`;
      }
      
      const response = await apiService.get<{ success: boolean; data: EventRequest[]; message?: string }>(url);
      
      if (response.success) {
        setRequests(response.data || []);
        setFilteredRequests(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch event requests');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch event requests');
    } finally {
      setIsLoading(false);
    }
  }, [role, user?._id]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    // Apply filters
    let filtered = [...requests];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request => 
        request.eventName.toLowerCase().includes(query) ||
        request.organizationName.toLowerCase().includes(query) ||
        request.requestId?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(request => request.status === statusFilter as EventRequestStatus);
    }
    
    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(request => request.category === categoryFilter);
    }
    
    setFilteredRequests(filtered);
  }, [requests, searchQuery, statusFilter, categoryFilter]);

  const getStatusColor = (status: EventRequestStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-600';
      case 'APPROVED':
        return 'bg-green-100 text-green-600';
      case 'REJECTED':
        return 'bg-red-100 text-red-600';
      case 'ORGANIZER_ASSIGNED':
        return 'bg-tangerine-100 text-tangerine-600';
      case 'PLANNING':
        return 'bg-blue-100 text-blue-600';
      case 'ACTIVE':
        return 'bg-orchid-100 text-orchid-600';
      case 'COMPLETED':
        return 'bg-green-100 text-green-600';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: EventRequestStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Pending Review';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'ORGANIZER_ASSIGNED':
        return 'Organizer Assigned';
      case 'PLANNING':
        return 'Planning';
      case 'ACTIVE':
        return 'Active';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleView = (request: EventRequest) => {
    navigate(`/event-requests/${request._id}`);
  };

  const handleCreate = () => {
    navigate('/event-requests/create');
  };

  const handleApprove = async (request: EventRequest) => {
    if (window.confirm(`Are you sure you want to approve "${request.eventName}"?`)) {
      try {
        const response = await apiService.patch<{ success: boolean; message: string }>(
          `/event-requests/${request._id}/approve`,
          { status: 'APPROVED' }
        );
        
        if (response.success) {
          fetchRequests();
        } else {
          setError(response.message || 'Failed to approve request');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to approve request');
      }
    }
  };

  const handleReject = async (request: EventRequest) => {
    if (window.confirm(`Are you sure you want to reject "${request.eventName}"?`)) {
      try {
        const response = await apiService.patch<{ success: boolean; message: string }>(
          `/event-requests/${request._id}/reject`,
          { status: 'REJECTED' }
        );
        
        if (response.success) {
          fetchRequests();
        } else {
          setError(response.message || 'Failed to reject request');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to reject request');
      }
    }
  };

  const statuses: EventRequestStatus[] = [
    'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ORGANIZER_ASSIGNED',
    'PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'
  ];

  const categories = [
    'CONFERENCE', 'CONCERT', 'FESTIVAL', 'SPORTS', 'CHARITY',
    'COMMUNITY', 'CORPORATE', 'EDUCATION', 'HEALTH', 'ENVIRONMENT',
    'ARTS', 'TECHNOLOGY', 'FOOD', 'OTHER'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent mb-2">
            Event Requests
          </h1>
          <p className="text-gray-500">
            {role === 'ADMIN' ? 'Manage all event requests' : 
             role === 'ORGANIZER' ? 'Event requests assigned to you' : 
             'Your event requests'}
          </p>
        </div>
        
        {(role === 'VOLUNTEER') && (
          <Button onClick={handleCreate} className="self-start lg:self-center">
            <Plus className="w-5 h-5" />
            Request Event
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search event requests..."
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('');
                setCategoryFilter('');
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
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        /* Requests List */
        <>
          {filteredRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Event Requests Found</h3>
              <p className="text-gray-500">
                {role === 'VOLUNTEER' 
                  ? 'You have not submitted any event requests yet.'
                  : 'No event requests found.'}
              </p>
              
              {role === 'VOLUNTEER' && (
                <Button onClick={handleCreate} className="mt-6">
                  <Plus className="w-5 h-5" />
                  Submit Your First Request
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredRequests.map((request, index) => (
                <motion.div
                  key={request._id as string || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{request.eventName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusText(request.status)}
                          </span>
                        </div>
                        
                        <p className="text-gray-500 mb-3 line-clamp-2">{request.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(request.eventDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span>{request.organizationName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{request.startTime} - {request.endTime}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span>Contact: {request.contactPerson}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{request.contactEmail}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{request.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(request)}
                          className="p-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        
                        {role === 'ADMIN' && request.status === 'PENDING_REVIEW' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(request)}
                              className="p-1.5 text-green-500 hover:text-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(request)}
                              className="p-1.5 text-red-500 hover:text-red-600"
                            >
                              <XCircle className="w-4 h-4" />
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

export default EventRequestListPage;
