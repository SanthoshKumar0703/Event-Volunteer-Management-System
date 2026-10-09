import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Users, Repeat, CheckCircle, Save } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Shift, UpdateShift } from '../../types/shift';

const ShiftEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<UpdateShift & { eventId: string; date: string }>({
    name: '',
    description: '',
    eventId: '',
    startTime: '',
    endTime: '',
    date: new Date().toISOString().split('T')[0],
    capacity: 0,
    color: '',
    isRecurring: false,
    breakDuration: 0,
    checkInStart: '',
    checkInEnd: '',
    status: 'OPEN',
  });
  
  const [events, setEvents] = useState<{ _id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch shift
        const shiftResponse = await apiService.get<{ success: boolean; data: Shift }>(
          `/shifts/${id}`
        );
        
        if (shiftResponse.success) {
          const shift = shiftResponse.data;
          setFormData({
            name: shift.name,
            description: shift.description || '',
            eventId: shift.eventId as string,
            startTime: shift.startTime,
            endTime: shift.endTime,
            date: new Date(shift.date).toISOString().split('T')[0],
            capacity: shift.capacity,
            color: shift.color || '#FF7A33',
            isRecurring: shift.isRecurring || false,
            recurrencePattern: shift.recurrencePattern,
            breakDuration: shift.breakDuration || 0,
            checkInStart: shift.checkInStart || '',
            checkInEnd: shift.checkInEnd || '',
            status: shift.status as any,
          });
        }
        
        // Fetch events
        const eventsResponse = await apiService.get<{ success: boolean; data: any[] }>('/events');
        if (eventsResponse.success) {
          setEvents(eventsResponse.data.map(event => ({
            _id: event._id as string,
            title: event.title
          })));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleRecurringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isRecurring = e.target.checked;
    setFormData(prev => ({
      ...prev,
      isRecurring,
      recurrencePattern: isRecurring ? {
        type: prev.recurrencePattern?.type || 'WEEKLY',
        interval: prev.recurrencePattern?.interval || 1,
      } : undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate required fields
      if (!formData.name || !formData.eventId || !formData.startTime || !formData.endTime || !formData.date) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      // Validate time format
      if (!/^\d{2}:\d{2}$/.test(formData.startTime) || !/^\d{2}:\d{2}$/.test(formData.endTime)) {
        setError('Please use HH:mm format for times');
        setIsSubmitting(false);
        return;
      }
      
      const response = await apiService.put<{ success: boolean; data: any; message?: string }>(
        `/shifts/${id}`,
        formData
      );
      
      if (response.success) {
        setSuccess('Shift updated successfully!');
        setTimeout(() => {
          navigate(`/shifts/${id}`);
        }, 1500);
      } else {
        setError(response.message || 'Failed to update shift');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update shift');
    } finally {
      setIsSubmitting(false);
    }
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
        <Button variant="ghost" onClick={() => navigate(`/shifts/${id}`)} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent">
          Edit Shift
        </h1>
      </div>

      <Card className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Shift Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Morning Registration Shift"
                required
              />
              
              <Input
                label="Event *"
                name="eventId"
                type="select"
                value={formData.eventId}
                onChange={handleChange}
                required
              >
                <option value="">Select Event</option>
                {events.map(event => (
                  <option key={event._id} value={event._id}>{event.title}</option>
                ))}
              </Input>
            </div>
            
            <div className="mt-4">
              <Input
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the shift responsibilities..."
                multiline
                rows={3}
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Schedule</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Date *"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
              
              <Input
                label="Start Time *"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
              
              <Input
                label="End Time *"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={handleRecurringChange}
                className="w-4 h-4 text-tangerine-500 rounded focus:ring-tangerine-500"
              />
              <label htmlFor="isRecurring" className="text-gray-700 cursor-pointer">
                This is a recurring shift
              </label>
            </div>
            
            {formData.isRecurring && formData.recurrencePattern && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-gray-50 rounded-lg"
              >
                <h3 className="font-semibold text-gray-800 mb-2">Recurrence Pattern</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Recurrence Type"
                    name="recurrenceType"
                    type="select"
                    value={formData.recurrencePattern?.type || 'WEEKLY'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurrencePattern: {
                        ...prev.recurrencePattern,
                        type: e.target.value as any
                      }
                    }))}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </Input>
                  
                  <Input
                    label="Interval"
                    name="interval"
                    type="number"
                    value={formData.recurrencePattern?.interval || 1}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurrencePattern: {
                        ...prev.recurrencePattern,
                        interval: parseInt(e.target.value) || 1
                      }
                    }))}
                    min={1}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Capacity & Settings */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Capacity & Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Capacity *"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                min={1}
                required
              />
              
              <Input
                label="Break Duration (minutes)"
                name="breakDuration"
                type="number"
                value={formData.breakDuration}
                onChange={handleChange}
                min={0}
              />
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Check-in Start Time"
                name="checkInStart"
                type="time"
                value={formData.checkInStart}
                onChange={handleChange}
              />
              
              <Input
                label="Check-in End Time"
                name="checkInEnd"
                type="time"
                value={formData.checkInEnd}
                onChange={handleChange}
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Shift Color"
                name="color"
                type="color"
                value={formData.color}
                onChange={handleChange}
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Status"
                name="status"
                type="select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="OPEN">Open</option>
                <option value="FULL">Full</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </Input>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-lg">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => navigate(`/shifts/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-5 h-5 mr-2" />
              {isSubmitting ? 'Updating...' : 'Update Shift'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};

export default ShiftEditPage;
