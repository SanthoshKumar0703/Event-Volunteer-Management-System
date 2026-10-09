import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Search, User, CheckCircle, XCircle, ArrowLeft, Calendar, Clock } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';

const CheckInPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [qrToken, setQrToken] = useState('');
  const [volunteerId, setVolunteerId] = useState('');
  const [eventId, setEventId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  
  const [events, setEvents] = useState<{ _id: string; title: string }[]>([]);
  const [volunteers, setVolunteers] = useState<{ _id: string; name: string }[]>([]);
  const [shifts, setShifts] = useState<{ _id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        const eventsResponse = await apiService.get<{ success: boolean; data: any[] }>('/events');
        if (eventsResponse.success) {
          setEvents(eventsResponse.data.map(event => ({
            _id: event._id as string,
            title: event.title
          })));
        }
        
        // Fetch volunteers
        const volunteersResponse = await apiService.get<{ success: boolean; data: any[] }>('/users?role=VOLUNTEER');
        if (volunteersResponse.success) {
          setVolunteers(volunteersResponse.data.map(v => ({
            _id: v._id as string,
            name: `${v.firstName} ${v.lastName}`
          })));
        }
        
        // Fetch shifts
        const shiftsResponse = await apiService.get<{ success: boolean; data: any[] }>('/shifts');
        if (shiftsResponse.success) {
          setShifts(shiftsResponse.data.map(s => ({
            _id: s._id as string,
            name: s.name
          })));
        }
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await apiService.post<{ success: boolean; data: any; message?: string }>(
        '/attendance/check-in',
        {
          eventId,
          volunteerId,
          shiftId,
          qrToken: qrToken || undefined,
          method: qrToken ? 'QR' : 'MANUAL'
        }
      );
      
      if (response.success) {
        setSuccess('Check-in successful!');
        setAttendanceData(response.data);
        setQrToken('');
        setVolunteerId('');
        setEventId('');
        setShiftId('');
      } else {
        setError(response.message || 'Failed to check in');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check in');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setIsCheckingOut(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await apiService.post<{ success: boolean; data: any; message?: string }>(
        '/attendance/check-out',
        {
          eventId,
          volunteerId,
          shiftId,
          qrToken: qrToken || undefined,
          method: qrToken ? 'QR' : 'MANUAL'
        }
      );
      
      if (response.success) {
        setSuccess('Check-out successful!');
        setAttendanceData(response.data);
        setQrToken('');
        setVolunteerId('');
        setEventId('');
        setShiftId('');
      } else {
        setError(response.message || 'Failed to check out');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check out');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleScanQR = () => {
    // In a real implementation, this would open a QR scanner
    setError('QR scanning is not implemented in this demo. Please enter the QR token manually.');
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="p-6 animate-pulse max-w-4xl mx-auto">
          <div className="h-8 bg-gray-200 rounded mb-4" />
          <div className="h-4 bg-gray-100 rounded mb-2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
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
          Check In / Out
        </h1>
      </div>

      {!attendanceData ? (
        <Card className="p-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QR Code Section */}
            <div className="border-r border-gray-200 pr-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">QR Code Check-in</h2>
              <p className="text-gray-500 mb-6">Scan the volunteer's QR code or enter the token manually.</p>
              
              <div className="flex flex-col items-center gap-4 mb-6">
                <div
                  className="w-48 h-48 border-2 border-tangerine-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-tangerine-300 transition-colors"
                  onClick={handleScanQR}
                >
                  <QrCode className="w-24 h-24 text-tangerine-400" />
                </div>
                <Button variant="outline" onClick={handleScanQR} className="w-full">
                  <QrCode className="w-5 h-5 mr-2" />
                  Scan QR Code
                </Button>
              </div>
              
              <Input
                label="Or enter QR Token manually"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="Enter QR token..."
              />
            </div>
            
            {/* Manual Section */}
            <div className="pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Manual Check-in</h2>
              <p className="text-gray-500 mb-6">Select the volunteer and event for manual check-in.</p>
              
              <div className="space-y-4">
                <Input
                  label="Event *"
                  type="select"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  required
                >
                  <option value="">Select Event</option>
                  {events.map(event => (
                    <option key={event._id} value={event._id}>{event.title}</option>
                  ))}
                </Input>
                
                <Input
                  label="Volunteer *"
                  type="select"
                  value={volunteerId}
                  onChange={(e) => setVolunteerId(e.target.value)}
                  required
                >
                  <option value="">Select Volunteer</option>
                  {volunteers.map(volunteer => (
                    <option key={volunteer._id} value={volunteer._id}>{volunteer.name}</option>
                  ))}
                </Input>
                
                <Input
                  label="Shift (Optional)"
                  type="select"
                  value={shiftId}
                  onChange={(e) => setShiftId(e.target.value)}
                >
                  <option value="">Select Shift</option>
                  {shifts.map(shift => (
                    <option key={shift._id} value={shift._id}>{shift.name}</option>
                  ))}
                </Input>
              </div>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mt-6">
              {error}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <Button
              onClick={handleCheckIn}
              disabled={isCheckingIn || !volunteerId || !eventId}
              className="flex-1"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {isCheckingIn ? 'Checking in...' : 'Check In'}
            </Button>
            <Button
              onClick={handleCheckOut}
              disabled={isCheckingOut || !volunteerId || !eventId}
              variant="outline"
              className="flex-1 text-orchid-600 hover:text-orchid-700"
            >
              <XCircle className="w-5 h-5 mr-2" />
              {isCheckingOut ? 'Checking out...' : 'Check Out'}
            </Button>
          </div>
        </Card>
      ) : (
        /* Success View */
        <Card className="p-6 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-green-600 mb-2">Success!</h2>
            <p className="text-gray-500">{success}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Attendance Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Volunteer:</span>
                <span className="font-medium text-gray-800">
                  {(attendanceData.volunteer as any)?.name || (attendanceData.volunteer as any)?.firstName || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Event:</span>
                <span className="font-medium text-gray-800">
                  {(attendanceData.event as any)?.title || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium text-gray-800">
                  {attendanceData.status === 'CHECKED_IN' ? 'Checked In' : 'Checked Out'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time:</span>
                <span className="font-medium text-gray-800">
                  {attendanceData.checkInTime ? new Date(attendanceData.checkInTime).toLocaleString() : 
                   attendanceData.checkOutTime ? new Date(attendanceData.checkOutTime).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={handleCheckIn} className="flex-1">
              <CheckCircle className="w-5 h-5 mr-2" />
              Check In Another
            </Button>
            <Button onClick={() => navigate('/attendance')} variant="outline" className="flex-1">
              Back to Attendance
            </Button>
          </div>
        </Card>
      )}
    </motion.div>
  );
};

export default CheckInPage;
