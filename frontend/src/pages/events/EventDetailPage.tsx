import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Users, ArrowLeft, Edit, Trash2, 
  Share2, Heart, Tag, Building2, Globe2, Mail, Phone,
  CheckCircle, XCircle, Loader2
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Event, EventStatus, EventCategory } from '../../types/event';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.get<{ success: boolean; data: Event; message?: string }>(
        `/events/${id}`
      );
      
      if (response.success) {
        setEvent(response.data);
        
        // Check if user has applied (for volunteers)
        if (role === 'VOLUNTEER' && user?._id) {
          const appsResponse = await apiService.get<{ success: boolean; data: any[] }>(
            `/applications?volunteerId=${user._id}&eventId=${id}`
          );
          if (appsResponse.success && appsResponse.data.length > 0) {
            setApplicationStatus(appsResponse.data[0].status);
          }
        }
      } else {
        setError(response.message || 'Event not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch event');
    } finally {
      setIsLoading(false);
    }
  }, [id, role, user?._id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

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

  const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case EventCategory.CONFERENCE:
        return <Building2 className="w-5 h-5" />;
      case EventCategory.CONCERT:
      case EventCategory.FESTIVAL:
      case EventCategory.ARTS:
        return <Globe2 className="w-5 h-5" />;
      case EventCategory.SPORTS:
        return <Tag className="w-5 h-5" />;
      case EventCategory.CHARITY:
      case EventCategory.COMMUNITY:
        return <Heart className="w-5 h-5" />;
      case EventCategory.CORPORATE:
        return <Building2 className="w-5 h-5" />;
      case EventCategory.EDUCATION:
        return <Globe2 className="w-5 h-5" />;
      case EventCategory.HEALTH:
        return <Heart className="w-5 h-5" />;
      case EventCategory.ENVIRONMENT:
        return <Globe2 className="w-5 h-5" />;
      case EventCategory.TECHNOLOGY:
        return <Globe2 className="w-5 h-5" />;
      case EventCategory.FOOD:
        return <Tag className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const handleApply = async () => {
    if (!user || !event) return;
    
    setIsApplying(true);
    
    try {
      const response = await apiService.post<{ success: boolean; message: string; data: any }>(
        '/applications',
        {
          eventId: event._id || event.eventId,
          volunteerId: user._id,
          coverLetter: ''
        }
      );
      
      if (response.success) {
        setApplicationStatus('PENDING');
        fetchEvent();
      } else {
        setError(response.message || 'Failed to apply');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to apply');
    } finally {
      setIsApplying(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/events/${event._id || event.eventId}`
        );
        
        if (response.success) {
          navigate(role === 'ADMIN' ? '/admin/events' : '/organizer/events');
        } else {
          setError(response.message || 'Failed to delete event');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete event');
      }
    }
  };

  const handleEdit = () => {
    if (event) {
      navigate(`/events/${event._id || event.eventId}/edit`);
    }
  };

  const calculateProgress = () => {
    if (!event) return 0;
    const current = event.currentVolunteers || 0;
    const required = event.requiredVolunteers || 1;
    return Math.min((current / required) * 100, 100);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64 bg-gray-100 rounded" />
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error && !event) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="max-w-4xl mx-auto p-6 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to={role === 'ADMIN' ? '/admin/events' : role === 'ORGANIZER' ? '/organizer/events' : '/events'}>
            <Button>
              <ArrowLeft className="w-5 h-5" />
              Back to Events
            </Button>
          </Link>
        </Card>
      </motion.div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to={role === 'ADMIN' ? '/admin/events' : role === 'ORGANIZER' ? '/organizer/events' : '/events'}>
            <span className="hover:text-tangerine-500">Events</span>
          </Link>
          <span>/</span>
          <span className="text-gray-800">{event.title}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{event.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                {getStatusText(event.status)}
              </span>
            </div>
            <p className="text-gray-500">{event.eventId}</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
              Back
            </Button>
            
            {(role === 'ADMIN' || role === 'ORGANIZER') && (
              <>
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="w-5 h-5" />
                  Edit
                </Button>
                <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:text-red-600">
                  <Trash2 className="w-5 h-5" />
                  Delete
                </Button>
              </>
            )}
            
            {role === 'VOLUNTEER' && (
              <Button
                variant="outline"
                onClick={() => setIsFavorite(!isFavorite)}
                className={isFavorite ? 'text-orchid-500' : ''}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {/* Event Image */}
        {event.image && (
          <Card className="mb-6 p-0 overflow-hidden">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-64 object-cover"
            />
          </Card>
        )}

        {/* Event Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">About This Event</h2>
            <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
            
            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {event.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tangerine-50 rounded-lg flex items-center justify-center">
                  {getCategoryIcon(event.category)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium text-gray-800">{event.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orchid-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orchid-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-800">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-apricot-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium text-gray-800">
                    {event.startTime} - {event.endTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registration Deadline</p>
                  <p className="font-medium text-gray-800">
                    {new Date(event.registrationDeadline).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tangerine-50 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-tangerine-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-800 line-clamp-2">
                      {event.location.venue}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Volunteer Progress */}
        {event.requiredVolunteers && (
          <Card className="mb-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Volunteer Registration</h2>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="font-medium">
                  {event.currentVolunteers || 0}/{event.requiredVolunteers}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Required</span>
                <span>{event.requiredVolunteers} volunteers</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-tangerine-500 to-orchid-500 h-2 rounded-full"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Registered</span>
                <span>{event.currentVolunteers || 0} volunteers</span>
              </div>
            </div>

            {/* Apply Button */}
            {role === 'VOLUNTEER' && event.status === EventStatus.OPEN_FOR_REGISTRATION && (
              <div className="mt-4 flex gap-2">
                {applicationStatus === 'PENDING' && (
                  <Button variant="outline" className="w-full bg-yellow-50 text-yellow-600 border-yellow-200">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Application Pending
                  </Button>
                )}
                {applicationStatus === 'APPROVED' && (
                  <Button className="w-full bg-green-500 hover:bg-green-600">
                    <CheckCircle className="w-5 h-5" />
                    Application Approved
                  </Button>
                )}
                {applicationStatus === 'REJECTED' && (
                  <Button variant="outline" className="w-full text-red-500 border-red-200">
                    <XCircle className="w-5 h-5" />
                    Application Rejected
                  </Button>
                )}
                {!applicationStatus && (
                  <Button
                    onClick={handleApply}
                    isLoading={isApplying}
                    className="w-full bg-gradient-to-r from-tangerine-500 to-orchid-500"
                  >
                    Apply to Volunteer
                  </Button>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Contact Information */}
        {(event.contactEmail || event.contactPhone) && (
          <Card className="mb-6 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
            
            <div className="space-y-3">
              {event.contactEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <a href={`mailto:${event.contactEmail}`} className="text-tangerine-500 hover:underline">
                    {event.contactEmail}
                  </a>
                </div>
              )}
              {event.contactPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <a href={`tel:${event.contactPhone}`} className="text-tangerine-500 hover:underline">
                    {event.contactPhone}
                  </a>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Social Links */}
        {event.socialLinks && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Social Links</h2>
            
            <div className="flex flex-wrap gap-3">
              {event.socialLinks.website && (
                <a
                  href={event.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Website
                </a>
              )}
              {event.socialLinks.facebook && (
                <a
                  href={event.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Facebook
                </a>
              )}
              {event.socialLinks.twitter && (
                <a
                  href={event.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Twitter
                </a>
              )}
              {event.socialLinks.instagram && (
                <a
                  href={event.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Instagram
                </a>
              )}
              {event.socialLinks.linkedin && (
                <a
                  href={event.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
};

export default EventDetailPage;
