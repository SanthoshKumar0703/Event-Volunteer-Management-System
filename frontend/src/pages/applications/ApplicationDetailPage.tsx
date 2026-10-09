import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, User as UserIcon, Mail, FileText, CheckCircle, XCircle, 
  ArrowLeft, Clock as ClockIcon, Tag, Building2, Phone
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Application, ApplicationStatus } from '../../types/application';
import { Event } from '../../types/event';
import { User } from '../../types/user';

const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [volunteer, setVolunteer] = useState<UserIcon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplication = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.get<{ success: boolean; data: Application; message?: string }>(
        `/applications/${id}`
      );
      
      if (response.success && response.data) {
        setApplication(response.data);
        
        // Fetch related event
        if (response.data.eventId) {
          const eventResponse = await apiService.get<{ success: boolean; data: Event }>(
            `/events/${response.data.eventId}`
          );
          if (eventResponse.success) {
            setEvent(eventResponse.data);
          }
        }
        
        // Fetch related volunteer
        if (response.data.volunteerId) {
          const volunteerResponse = await apiService.get<{ success: boolean; data: User }>(
            `/users/${response.data.volunteerId}`
          );
          if (volunteerResponse.success) {
            setVolunteer(volunteerResponse.data);
          }
        }
      } else {
        setError(response.message || 'Application not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch application');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchApplication();
    }
  }, [fetchApplication, id]);

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-600';
      case 'APPROVED':
        return 'bg-green-100 text-green-600';
      case 'REJECTED':
        return 'bg-red-100 text-red-600';
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: ApplicationStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'WITHDRAWN':
        return 'Withdrawn';
      default:
        return status;
    }
  };

  const handleApprove = async () => {
    if (!application) return;
    
    if (window.confirm(`Approve this application?`)) {
      try {
        const response = await apiService.post<{ success: boolean; message: string }>(
          `/applications/${application._id || application.applicationId}/approve`
        );
        
        if (response.success) {
          fetchApplication();
        } else {
          setError(response.message || 'Failed to approve application');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to approve application');
      }
    }
  };

  const handleReject = async () => {
    if (!application) return;
    
    const reason = prompt('Reason for rejection:');
    if (reason) {
      try {
        const response = await apiService.post<{ success: boolean; message: string }>(
          `/applications/${application._id || application.applicationId}/reject`,
          { reason }
        );
        
        if (response.success) {
          fetchApplication();
        } else {
          setError(response.message || 'Failed to reject application');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to reject application');
      }
    }
  };

  const handleWithdraw = async () => {
    if (!application) return;
    
    const reason = prompt('Reason for withdrawal:');
    if (reason) {
      try {
        const response = await apiService.post<{ success: boolean; message: string }>(
          `/applications/${application._id || application.applicationId}/withdraw`,
          { reason }
        );
        
        if (response.success) {
          fetchApplication();
        } else {
          setError(response.message || 'Failed to withdraw application');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to withdraw application');
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
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <Card className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error && !application) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="max-w-4xl mx-auto p-6 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to={role === 'ADMIN' ? '/admin/applications' : role === 'ORGANIZER' ? '/organizer/applications' : '/volunteer/applications'}>
            <Button>
              <ArrowLeft className="w-5 h-5" />
              Back to Applications
            </Button>
          </Link>
        </Card>
      </motion.div>
    );
  }

  if (!application) {
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
          <Link to={role === 'ADMIN' ? '/admin/applications' : role === 'ORGANIZER' ? '/organizer/applications' : '/volunteer/applications'}>
            <span className="hover:text-tangerine-500">Applications</span>
          </Link>
          <span>/</span>
          <span className="text-gray-800">{application.applicationId}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Application #{application.applicationId}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                {getStatusText(application.status)}
              </span>
            </div>
            <p className="text-gray-500">
              Applied on {new Date(application.applicationDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
              Back
            </Button>
            
            {role === 'ORGANIZER' && application.status === ApplicationStatus.PENDING && (
              <>
                <Button onClick={handleApprove} className="bg-green-500 hover:bg-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </Button>
                <Button onClick={handleReject} variant="outline" className="text-red-500 hover:text-red-600">
                  <XCircle className="w-5 h-5" />
                  Reject
                </Button>
              </>
            )}
            
            {role === 'VOLUNTEER' && application.status === ApplicationStatus.PENDING && (
              <Button onClick={handleWithdraw} variant="outline" className="text-orange-500 hover:text-orange-600">
                Withdraw Application
              </Button>
            )}
          </div>
        </div>

        {/* Application Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Event Information */}
          {event && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Information</h2>
              
              <div className="space-y-4">
                {event.image && (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Event</p>
                    <p className="font-medium text-gray-800">{event.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-800">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium text-gray-800">
                      {event.startTime} - {event.endTime}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Tag className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium text-gray-800">{event.category}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Volunteer Information */}
          {volunteer && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Volunteer Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {volunteer.profile?.profileImage && (
                    <img
                      src={volunteer.profile.profileImage}
                      alt={volunteer.fullName}
                      className="w-16 h-16 object-cover rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-800">{volunteer.fullName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{volunteer.email}</p>
                  </div>
                </div>
                
                {volunteer.profile?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-800">{volunteer.profile.phone}</p>
                    </div>
                  </div>
                )}
                
                {volunteer.performanceScore && (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 text-gray-400">★</div>
                    <div>
                      <p className="text-sm text-gray-500">Performance Score</p>
                      <p className="font-medium text-gray-800">{volunteer.performanceScore}/100</p>
                    </div>
                  </div>
                )}
                
                {volunteer.totalVolunteerHours && (
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Total Hours</p>
                      <p className="font-medium text-gray-800">{volunteer.totalVolunteerHours} hours</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Application Details */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Application Details</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Application ID</p>
                <p className="font-medium text-gray-800">{application.applicationId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Application Date</p>
                <p className="font-medium text-gray-800">
                  {new Date(application.applicationDate).toLocaleString()}
                </p>
              </div>
            </div>
            
            {application.roleId && (
              <div className="flex items-center gap-3">
                <UserIcon className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium text-gray-800">{application.roleId}</p>
                </div>
              </div>
            )}
            
            {application.matchScore && (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 text-gray-400">🎯</div>
                <div>
                  <p className="text-sm text-gray-500">Match Score</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800">{application.matchScore}%</p>
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div
                        className="bg-gradient-to-r from-tangerine-500 to-orchid-500 h-2 rounded-full"
                        style={{ width: `${application.matchScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {application.coverLetter && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Cover Letter</h3>
                <p className="text-gray-600 whitespace-pre-line">{application.coverLetter}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Answers */}
        {application.answers && application.answers.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Application Answers</h2>
            
            <div className="space-y-4">
              {application.answers.map((answer, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-800 mb-1">{answer.question}</p>
                  <p className="text-gray-600">{answer.answer}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Review Information */}
        {(application.reviewedAt || application.rejectionReason) && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Review Information</h2>
            
            <div className="space-y-4">
              {application.reviewedAt && (
                <div className="flex items-center gap-3">
                  <UserIcon className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Reviewed By</p>
                    <p className="font-medium text-gray-800">{application.reviewedBy}</p>
                  </div>
                </div>
              )}
              
              {application.reviewedAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Reviewed At</p>
                    <p className="font-medium text-gray-800">
                      {new Date(application.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              {application.rejectionReason && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-lg font-medium text-red-500 mb-2">Rejection Reason</h3>
                  <p className="text-gray-600">{application.rejectionReason}</p>
                </div>
              )}
              
              {application.notes && application.notes.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Notes</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {application.notes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
};

export default ApplicationDetailPage;
