import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Search, Filter, Plus, Eye, Edit, Trash2, Users, Clock, MapPin, Tag } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Event, EventStatus } from '../../types/event';

interface EventListPageProps {
  role: 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER';
}

const EventListPage: React.FC<EventListPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '/events';
      
      if (role === 'ORGANIZER' && user?._id) {
        url = `/events?organizer=${user._id}`;
      } else if (role === 'VOLUNTEER' && user?._id) {
        url = `/events?volunteer=${user._id}`;
      }
      
      const response = await apiService.get<{ success: boolean; data: Event[]; message?: string }>(url);
      
      if (response.success) {
        setEvents(response.data || []);
        setFilteredEvents(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch events');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, [role, user?._id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    // Apply filters
    let filtered = [...events];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.eventId?.toLowerCase().includes(query) ||
        event.location?.venue?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(event => event.status === statusFilter);
    }
    
    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }
    
    setFilteredEvents(filtered);
  }, [events, searchQuery, statusFilter, categoryFilter]);

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case EventStatus.DRAFT:
        return 'bg-gray-100 text-gray-600';
      case EventStatus.PENDING:
        return 'bg-yellow-100 text-yellow-600';
      case EventStatus.OPEN_FOR_REGISTRATION:
        return 'bg-blue-100 text-blue-600';
      case EventStatus.UPCOMING:
        return 'bg-orchid-100 text-orchid-600';
      case EventStatus.LIVE:
        return 'bg-tangerine-100 text-tangerine-600';
      case EventStatus.COMPLETED:
        return 'bg-green-100 text-green-600';
      case EventStatus.CANCELLED:
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: EventStatus) => {
    switch (status) {
      case EventStatus.DRAFT:
        return 'Draft';
      case EventStatus.PENDING:
        return 'Pending';
      case EventStatus.OPEN_FOR_REGISTRATION:
        return 'Open for Registration';
      case EventStatus.UPCOMING:
        return 'Upcoming';
      case EventStatus.LIVE:
        return 'Live';
      case EventStatus.COMPLETED:
        return 'Completed';
      case EventStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleView = (event: Event) => {
    navigate(`/events/${event._id || event.eventId}`);
  };

  const handleEdit = (event: Event) => {
    navigate(`/events/${event._id || event.eventId}/edit`);
  };

  const handleDelete = async (event: Event) => {
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/events/${event._id || event.eventId}`
        );
        
        if (response.success) {
          fetchEvents();
        } else {
          setError(response.message || 'Failed to delete event');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete event');
      }
    }
  };

  const handleCreate = () => {
    navigate('/events/create');
  };

  const categories = [
    'CONFERENCE', 'CONCERT', 'FESTIVAL', 'SPORTS', 'CHARITY',
    'COMMUNITY', 'CORPORATE', 'EDUCATION', 'HEALTH', 'ENVIRONMENT',
    'ARTS', 'TECHNOLOGY', 'FOOD', 'OTHER'
  ];

  const statuses = [
    EventStatus.DRAFT,
    EventStatus.PENDING,
    EventStatus.OPEN_FOR_REGISTRATION,
    EventStatus.UPCOMING,
    EventStatus.LIVE,
    EventStatus.COMPLETED,
    EventStatus.CANCELLED
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
            Events
          </h1>
          <p className="text-gray-500">
            {role === 'ADMIN' ? 'Manage all events' : 
             role === 'ORGANIZER' ? 'Manage your events' : 
             'Events you can volunteer for'}
          </p>
        </div>
        
        {(role === 'ADMIN' || role === 'ORGANIZER') && (
          <Button onClick={handleCreate} className="self-start lg:self-center">
            <Plus className="w-5 h-5" />
            Create Event
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
              placeholder="Search events..."
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
        /* Events Grid */
        <>
          {filteredEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Events Found</h3>
              <p className="text-gray-500">
                {role === 'VOLUNTEER' 
                  ? 'No events are currently available for volunteering.'
                  : 'You have not created any events yet.'}
              </p>
              
              {(role === 'ADMIN' || role === 'ORGANIZER') && (
                <Button onClick={handleCreate} className="mt-6">
                  <Plus className="w-5 h-5" />
                  Create Your First Event
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event._id || event.eventId || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="p-4 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      {event.image && (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {getStatusText(event.status)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{event.title}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{event.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{event.startTime} - {event.endTime}</span>
                      </div>
                      {event.location?.venue && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{event.location.venue}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {event.currentVolunteers || 0}/{event.requiredVolunteers || 0}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(event)}
                          className="p-1.5"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {(role === 'ADMIN' || role === 'ORGANIZER') && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(event)}
                              className="p-1.5"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(event)}
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

export default EventListPage;
