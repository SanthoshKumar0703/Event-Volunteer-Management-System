import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Users, CheckCircle, XCircle, MapPin, User, QrCode } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Attendance, AttendanceStatus } from '../../types/attendance';

const AttendanceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiService.get<{ success: boolean; data: Attendance; message?: string }>(
          `/attendance/${id}`
        );
        
        if (response.success) {
          setAttendance(response.data);
        } else {
          setError(response.message || 'Failed to fetch attendance record');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch attendance record');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchAttendance();
    }
  }, [id]);

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

  const getCheckInMethodText = (method?: string) => {
    switch (method) {
      case 'QR':
        return 'QR Code';
      case 'MANUAL':
        return 'Manual';
      case 'AUTO':
        return 'Auto';
      default:
        return 'N/A';
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

  if (!attendance) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Attendance Record Not Found</h3>
          <Button onClick={() => navigate('/attendance')} variant="ghost" className="mt-4">
            Back to Attendance
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/attendance')} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent">
          Attendance Details
        </h1>
      </div>

      {/* Attendance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(attendance.status)}`}>
              {getStatusText(attendance.status)}
            </span>
          </div>
          
          {/* Volunteer Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-tangerine-100 rounded-full flex items-center justify-center">
              <span className="text-tangerine-600 font-bold text-xl">
                {(attendance.volunteer as any)?.firstName?.charAt(0) || 'V'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {(attendance.volunteer as any)?.name || (attendance.volunteer as any)?.firstName || 'Volunteer'}
              </h2>
              <p className="text-gray-500">
                {(attendance.volunteer as any)?.email || 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Event Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Event Information</h3>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-tangerine-500" />
              <span className="text-gray-800">
                {(attendance.event as any)?.title || (attendance.event as any)?._id || 'N/A'}
              </span>
            </div>
            {attendance.shift && (
              <div className="flex items-center gap-3 mt-2">
                <Clock className="w-5 h-5 text-tangerine-500" />
                <span className="text-gray-800">
                  {(attendance.shift as any).name || (attendance.shift as any)._id || 'N/A'}
                </span>
              </div>
            )}
          </div>
          
          {/* Timeline */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Check-in</p>
                  <p className="text-gray-500 text-sm">
                    {attendance.checkInTime ? new Date(attendance.checkInTime).toLocaleString() : 'Not checked in'}
                  </p>
                  {attendance.checkInMethod && (
                    <p className="text-gray-400 text-xs mt-1">
                      Method: {getCheckInMethodText(attendance.checkInMethod)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orchid-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-4 h-4 text-orchid-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Check-out</p>
                  <p className="text-gray-500 text-sm">
                    {attendance.checkOutTime ? new Date(attendance.checkOutTime).toLocaleString() : 'Not checked out'}
                  </p>
                  {attendance.checkOutMethod && (
                    <p className="text-gray-400 text-xs mt-1">
                      Method: {getCheckInMethodText(attendance.checkOutMethod)}
                    </p>
                  )}
                </div>
              </div>
              
              {attendance.totalHours && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-tangerine-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-tangerine-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Total Hours</p>
                    <p className="text-gray-500 text-sm">{attendance.totalHours} hours</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Notes */}
          {attendance.notes && (
            <div className="p-4 bg-lilac-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
              <p className="text-gray-600">{attendance.notes}</p>
            </div>
          )}
        </Card>
        
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Attendance Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Attendance ID:</span>
                <span className="font-medium text-gray-800">{attendance.attendanceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${getStatusColor(attendance.status)}`}>
                  {getStatusText(attendance.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="font-medium text-gray-800">{new Date(attendance.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated:</span>
                <span className="font-medium text-gray-800">{new Date(attendance.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
          
          {/* Check-in/out By */}
          {(attendance.checkInBy || attendance.checkOutBy) && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Actions By</h3>
              <div className="space-y-3">
                {attendance.checkInBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Checked in by:</span>
                    <span className="font-medium text-gray-800">
                      {(attendance.checkInBy as any)?.name || (attendance.checkInBy as any)?.firstName || 'N/A'}
                    </span>
                  </div>
                )}
                {attendance.checkOutBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Checked out by:</span>
                    <span className="font-medium text-gray-800">
                      {(attendance.checkOutBy as any)?.name || (attendance.checkOutBy as any)?.firstName || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}
          
          {/* QR Token */}
          {attendance.qrToken && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">QR Code</h3>
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-tangerine-500" />
                <span className="font-medium text-gray-800 text-sm">{attendance.qrToken}</span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AttendanceDetailPage;
