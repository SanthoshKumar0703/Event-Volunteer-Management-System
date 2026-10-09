import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User as UserIcon, Mail, Phone, Building, MapPin, Clock, CheckCircle, XCircle, Edit, Trash2, FileText } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { EventRequest, EventRequestStatus } from '../../types/eventRequest';

const EventRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [request, setRequest] = useState<EventRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiService.get<{ success: boolean; data: EventRequest; message?: string }>(
          `/event-requests/${id}`
        );
        
        if (response.success) {
          setRequest(response.data);
        } else {
          setError(response.message || 'Failed to fetch event request');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch event request');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchRequest();
    }
  }, [id]);

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

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this event request?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/event-requests/${id}`
        );
        
        if (response.success) {
          navigate('/event-requests');
        } else {
          setError(response.message || 'Failed to delete event request');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete event request');
      }
    }
  };

  const handleApprove = async () => {
    if (window.confirm(`Are you sure you want to approve "${request?.eventName}"?`)) {
      try {
        const response = await apiService.patch<{ success: boolean; message: string }>(
          `/event-requests/${id}/approve`,
          { status: 'APPROVED' }
        );
        
        if (response.success) {
          setRequest(prev => prev ? { ...prev, status: 'APPROVED' } : null);
        } else {
          setError(response.message || 'Failed to approve request');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to approve request');
      }
    }
  };

  const handleReject = async () => {
    if (window.confirm(`Are you sure you want to reject "${request?.eventName}"?`)) {
      try {
        const response = await apiService.patch<{ success: boolean; message: string }>(
          `/event-requests/${id}/reject`,
          { status: 'REJECTED' }
        );
        
        if (response.success) {
          setRequest(prev => prev ? { ...prev, status: 'REJECTED' } : null);
        } else {
          setError(response.message || 'Failed to reject request');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to reject request');
      }
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4" />
          <div className="h-4 bg-gray-100 rounded mb-2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </Card>
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

  if (!request) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Event Request Not Found</h3>
          <Button onClick={() => navigate('/event-requests')} variant="ghost" className="mt-4">
            Back to Event Requests
          </Button>
        </Card>
      </motion.div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';
  const isVolunteer = user?.role === 'VOLUNTEER';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/event-requests')} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent">
          Event Request Details
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        {isAdmin && (
          <>
            <Button onClick={() => navigate(`/event-requests/${request._id}/edit`)}>
              <Edit className="w-5 h-5 mr-2" />
              Edit Request
            </Button>
            <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-5 h-5 mr-2" />
              Delete
            </Button>
          </>
        )}
        
        {isAdmin && request.status === 'PENDING_REVIEW' && (
          <>
            <Button onClick={handleApprove} className="bg-green-500 hover:bg-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              Approve
            </Button>
            <Button onClick={handleReject} variant="outline" className="text-red-500 hover:text-red-600">
              <XCircle className="w-5 h-5 mr-2" />
              Reject
            </Button>
          </>
        )}
      </div>

      {/* Request Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
              {getStatusText(request.status)}
            </span>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{request.eventName}</h2>
          
          <p className="text-gray-600 mb-6">{request.description}</p>
          
          {/* Event Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-4">Event Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-tangerine-500" />
                <div>
                  <p className="font-medium text-gray-800">Date</p>
                  <p className="text-gray-600 text-sm">{new Date(request.eventDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-tangerine-500" />
                <div>
                  <p className="font-medium text-gray-800">Time</p>
                  <p className="text-gray-600 text-sm">{request.startTime} - {request.endTime}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-tangerine-500" />
                <div>
                  <p className="font-medium text-gray-800">Expected Attendees</p>
                  <p className="text-gray-600 text-sm">{request.expectedAttendees}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-tangerine-500" />
                <div>
                  <p className="font-medium text-gray-800">Volunteers Needed</p>
                  <p className="text-gray-600 text-sm">{request.requiredVolunteers}</p>
                </div>
              </div>
            </div>
            
            {request.requiredSkills && request.requiredSkills.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-gray-800 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {request.requiredSkills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-tangerine-100 text-tangerine-600 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {request.additionalRequirements && (
              <div className="mt-4">
                <p className="font-medium text-gray-800 mb-2">Additional Requirements</p>
                <p className="text-gray-600 text-sm">{request.additionalRequirements}</p>
              </div>
            )}
          </div>
          
          {/* Venue Information */}
          <div className="mb-6 p-4 bg-lilac-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-4">Venue Information</h3>
            
            <div className="flex items-center gap-3 mb-2">
              <Building className="w-5 h-5 text-orchid-500" />
              <span className="font-medium text-gray-800">{request.venue}</span>
            </div>
            
            {request.venueAddress && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{request.venueAddress}</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              {request.venueCity && (
                <span>{request.venueCity}</span>
              )}
              {request.venueState && (
                <span>{request.venueState}</span>
              )}
              {request.venuePostalCode && (
                <span>{request.venuePostalCode}</span>
              )}
              {request.venueCountry && (
                <span>{request.venueCountry}</span>
              )}
            </div>
          </div>
          
          {/* Notes */}
          {request.notes && request.notes.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
              <div className="space-y-2">
                {request.notes.map((note, index) => (
                  <div key={index} className="p-2 bg-white rounded border border-gray-200">
                    <p className="text-gray-600 text-sm">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
        
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Request Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Request ID:</span>
                <span className="font-medium text-gray-800">{request.requestId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium text-gray-800">{request.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="font-medium text-gray-800">{new Date(request.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated:</span>
                <span className="font-medium text-gray-800">{new Date(request.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
          
          {/* Organization Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Organization</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-tangerine-500" />
                <span className="font-medium text-gray-800">{request.organizationName}</span>
              </div>
              {request.website && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 text-tangerine-500">🌐</div>
                  <span className="font-medium text-gray-800 text-sm">{request.website}</span>
                </div>
              )}
              {request.socialMediaLinks && request.socialMediaLinks.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 text-tangerine-500">📱</div>
                  <div className="flex flex-wrap gap-1">
                    {request.socialMediaLinks.map((link, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {link}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          {/* Contact Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-tangerine-500" />
                <span className="font-medium text-gray-800">{request.contactPerson}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-tangerine-500" />
                <span className="font-medium text-gray-800 text-sm">{request.contactEmail}</span>
              </div>
              {request.contactPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-tangerine-500" />
                  <span className="font-medium text-gray-800 text-sm">{request.contactPhone}</span>
                </div>
              )}
            </div>
          </Card>
          
          {/* Budget */}
          {request.budget && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Budget</h3>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 text-green-500">$</div>
                <span className="font-medium text-gray-800">${request.budget.toLocaleString()}</span>
              </div>
            </Card>
          )}
          
          {/* Actions */}
          {isAdmin && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Actions</h3>
              <div className="space-y-3">
                <Button onClick={() => navigate(`/event-requests/${request._id}/edit`)} className="w-full">
                  <Edit className="w-5 h-5 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={handleDelete} className="w-full text-red-500 hover:text-red-600">
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete
                </Button>
                {request.status === 'PENDING_REVIEW' && (
                  <>
                    <Button onClick={handleApprove} className="w-full bg-green-500 hover:bg-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Approve
                    </Button>
                    <Button onClick={handleReject} variant="outline" className="w-full text-red-500 hover:text-red-600">
                      <XCircle className="w-5 h-5 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EventRequestDetailPage;
