import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, User as UserIcon, Calendar, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Application, ApplicationStatus } from '../../types/application';
import { Event } from '../../types/event';

interface ApplicationListPageProps {
  role: 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER';
}

const ApplicationListPage: React.FC<ApplicationListPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let appsUrl = '/applications';
      let eventsUrl = '/events';
      
      if (role === 'ORGANIZER' && user?._id) {
        // Get applications for organizer's events
        const organizerEvents = await apiService.get<{ success: boolean; data: Event[] }>(
          `/events?organizer=${user._id}`
        );
        
        if (organizerEvents.success) {
          setEvents(organizerEvents.data || []);
          const eventIds = organizerEvents.data.map(e => e._id || e.eventId).join(',');
          appsUrl = `/applications?eventIds=${eventIds}`;
        }
      } else if (role === 'VOLUNTEER' && user?._id) {
        appsUrl = `/applications?volunteerId=${user._id}`;
      }
      
      const appsResponse = await apiService.get<{ success: boolean; data: Application[]; message?: string }>(appsUrl);
      
      if (appsResponse.success) {
        setApplications(appsResponse.data || []);
        setFilteredApplications(appsResponse.data || []);
      } else {
        setError(appsResponse.message || 'Failed to fetch applications');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  }, [role, user?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Apply filters
    let filtered = [...applications];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.eventId?.toLowerCase().includes(query) ||
        app.applicationId?.toLowerCase().includes(query) ||
        app.coverLetter?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    setFilteredApplications(filtered);
  }, [applications, searchQuery, statusFilter]);

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-600';
      case ApplicationStatus.APPROVED:
        return 'bg-green-100 text-green-600';
      case ApplicationStatus.REJECTED:
        return 'bg-red-100 text-red-600';
      case ApplicationStatus.WITHDRAWN:
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return 'Pending';
      case ApplicationStatus.APPROVED:
        return 'Approved';
      case ApplicationStatus.REJECTED:
        return 'Rejected';
      case ApplicationStatus.WITHDRAWN:
        return 'Withdrawn';
      default:
        return status;
    }
  };

  const getEventById = (eventId: string) => {
    return events.find(e => e._id === eventId || e.eventId === eventId);
  };

  const handleView = (app: Application) => {
    navigate(`/applications/${app._id || app.applicationId}`);
  };

  const handleApprove = async (app: Application) => {
    if (window.confirm(`Approve application from volunteer?`)) {
      try {
        const response = await apiService.post<{ success: boolean; message: string }>(
          `/applications/${app._id || app.applicationId}/approve`
        );
        
        if (response.success) {
          fetchData();
        } else {
          setError(response.message || 'Failed to approve application');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to approve application');
      }
    }
  };

  const handleReject = async (app: Application) => {
    const reason = prompt('Reason for rejection:');
    if (reason) {
      try {
        const response = await apiService.post<{ success: boolean; message: string }>(
          `/applications/${app._id || app.applicationId}/reject`,
          { reason }
        );
        
        if (response.success) {
          fetchData();
        } else {
          setError(response.message || 'Failed to reject application');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to reject application');
      }
    }
  };

  const handleWithdraw = async (app: Application) => {
    const reason = prompt('Reason for withdrawal:');
    if (reason) {
      try {
        const response = await apiService.post<{ success: boolean; message: string }>(
          `/applications/${app._id || app.applicationId}/withdraw`,
          { reason }
        );
        
        if (response.success) {
          fetchData();
        } else {
          setError(response.message || 'Failed to withdraw application');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to withdraw application');
      }
    }
  };

  const statuses = [
    ApplicationStatus.PENDING,
    ApplicationStatus.APPROVED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN
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
            Applications
          </h1>
          <p className="text-gray-500">
            {role === 'ADMIN' ? 'Manage all applications' : 
             role === 'ORGANIZER' ? 'Manage applications for your events' : 
             'Your volunteer applications'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
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
            
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('');
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
        /* Applications List */
        <>
          {filteredApplications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Applications Found</h3>
              <p className="text-gray-500">
                {role === 'VOLUNTEER' 
                  ? 'You have not applied to any events yet.'
                  : 'There are no applications for your events yet.'}
              </p>
              
              {role === 'VOLUNTEER' && (
                <Button onClick={() => navigate('/events')} className="mt-6">
                  Browse Events
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredApplications.map((app, index) => {
                const event = getEventById(app.eventId || '');
                
                return (
                  <motion.div
                    key={app._id || app.applicationId || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <Card className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {event?.image && (
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800">
                                {event?.title || 'Unknown Event'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {app.applicationId}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className={`px-2 py-1 rounded-full ${getStatusColor(app.status)}`}>
                              {getStatusText(app.status)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-4 h-4" />
                              {app.volunteerId}
                            </span>
                            {app.matchScore && (
                              <span className="flex items-center gap-1">
                                Match: {app.matchScore}%
                              </span>
                            )}
                          </div>
                          
                          {app.coverLetter && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                              {app.coverLetter}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(app)}
                            className="p-1.5"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {role === 'ORGANIZER' && app.status === ApplicationStatus.PENDING && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(app)}
                                className="p-1.5 text-green-500"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(app)}
                                className="p-1.5 text-red-500"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          
                          {role === 'VOLUNTEER' && app.status === ApplicationStatus.PENDING && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWithdraw(app)}
                              className="p-1.5 text-orange-500"
                            >
                              Withdraw
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default ApplicationListPage;
