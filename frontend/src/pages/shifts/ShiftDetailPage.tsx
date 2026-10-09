import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Repeat, MapPin } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Shift } from '../../types/shift';

const ShiftDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [shift, setShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShift = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiService.get<{ success: boolean; data: Shift; message?: string }>(
          `/shifts/${id}`
        );
        
        if (response.success) {
          setShift(response.data);
        } else {
          setError(response.message || 'Failed to fetch shift');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch shift');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchShift();
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${shift?.name}"?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/shifts/${id}`
        );
        
        if (response.success) {
          navigate('/shifts');
        } else {
          setError(response.message || 'Failed to delete shift');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete shift');
      }
    }
  };

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

  if (!shift) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Shift Not Found</h3>
          <Link to="/shifts" className="text-tangerine-500 hover:underline mt-4 inline-block">
            Back to Shifts
          </Link>
        </Card>
      </motion.div>
    );
  }

  const isAdminOrOrganizer = user?.role === 'ADMIN' || user?.role === 'ORGANIZER';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/shifts')} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent">
          {shift.name}
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        {isAdminOrOrganizer && (
          <>
            <Button onClick={() => navigate(`/shifts/${shift._id}/edit`)}>
              <Edit className="w-5 h-5 mr-2" />
              Edit Shift
            </Button>
            <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-5 h-5 mr-2" />
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Shift Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shift.status)}`}>
              {getStatusText(shift.status)}
            </span>
          </div>
          
          <p className="text-gray-600 mb-6">{shift.description}</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-tangerine-500" />
              <span className="text-gray-800">{new Date(shift.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-tangerine-500" />
              <span className="text-gray-800">{shift.startTime} - {shift.endTime}</span>
            </div>
            {shift.isRecurring && (
              <div className="flex items-center gap-3">
                <Repeat className="w-5 h-5 text-tangerine-500" />
                <span className="text-gray-800">Recurring Shift</span>
              </div>
            )}
            {shift.breakDuration && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5" />
                <span className="text-gray-800">Break: {shift.breakDuration} minutes</span>
              </div>
            )}
          </div>
          
          {/* Capacity Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Capacity</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-tangerine-500" />
                <span className="text-2xl font-bold text-gray-800">{shift.assignedCount || 0}</span>
                <span className="text-gray-500">Assigned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5" />
                <span className="text-2xl font-bold text-gray-800">{shift.capacity || 0}</span>
                <span className="text-gray-500">Total Capacity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5" />
                <span className="text-2xl font-bold text-gray-800">{shift.availableSlots || 0}</span>
                <span className="text-gray-500">Available</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-tangerine-500 to-orchid-500 h-2 rounded-full"
                  style={{ width: `${((shift.assignedCount || 0) / (shift.capacity || 1)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          {/* Check-in Info */}
          {(shift.checkInStart || shift.checkInEnd) && (
            <div className="mt-6 p-4 bg-lilac-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Check-in Window</h3>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-orchid-500" />
                <span className="text-gray-800">{shift.checkInStart} - {shift.checkInEnd}</span>
              </div>
            </div>
          )}
        </Card>
        
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Shift Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Shift ID:</span>
                <span className="font-medium text-gray-800">{shift.shiftId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Event:</span>
                <span className="font-medium text-gray-800 line-clamp-1">{shift.eventId as string}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="font-medium text-gray-800">{new Date(shift.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated:</span>
                <span className="font-medium text-gray-800">{new Date(shift.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
          
          {shift.color && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Shift Color</h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: shift.color }} />
                <span className="font-medium text-gray-800">{shift.color}</span>
              </div>
            </Card>
          )}
          
          {/* Volunteers List */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Assigned Volunteers ({shift.volunteers?.length || 0})</h3>
            {shift.volunteers && shift.volunteers.length > 0 ? (
              <div className="space-y-3">
                {shift.volunteers.slice(0, 5).map((volunteer, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-tangerine-100 rounded-full flex items-center justify-center">
                      <span className="text-tangerine-600 font-medium text-sm">
                        {(volunteer.volunteerId as any)?.firstName?.charAt(0) || 'V'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {(volunteer.volunteerId as any)?.firstName || 'Volunteer'}
                      </p>
                      <p className="text-gray-500 text-xs">{volunteer.status}</p>
                    </div>
                  </div>
                ))}
                {shift.volunteers.length > 5 && (
                  <p className="text-sm text-gray-500">+{shift.volunteers.length - 5} more</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No volunteers assigned</p>
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ShiftDetailPage;
