import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Eye, Users, Clock } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Event } from '../../types/event';
import { Shift } from '../../types/shift';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'event' | 'shift' | 'task';
  color: string;
  allDay: boolean;
  description?: string;
  location?: string;
  capacity?: number;
  assignedCount?: number;
}

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let url = '/events';
        if (user?.role === 'ORGANIZER') {
          url = `/events?organizer=${user._id}`;
        } else if (user?.role === 'VOLUNTEER') {
          url = `/events?volunteer=${user._id}`;
        }
        
        const response = await apiService.get<{ success: boolean; data: Event[]; message?: string }>(url);
        
        if (response.success) {
          const calendarEvents: CalendarEvent[] = response.data.map(event => ({
            id: event._id as string,
            title: event.title,
            start: new Date(event.date as string),
            end: new Date(event.date as string),
            type: 'event',
            color: '#FF7A33',
            allDay: true,
            description: event.description,
            location: event.location?.venue,
            capacity: event.requiredVolunteers,
            assignedCount: event.currentVolunteers,
          }));
          
          // Fetch shifts
          const shiftsResponse = await apiService.get<{ success: boolean; data: Shift[] }>('/shifts');
          if (shiftsResponse.success) {
            const shiftEvents = shiftsResponse.data.map(shift => ({
              id: shift._id as string,
              title: shift.name,
              start: new Date(shift.date as string),
              end: new Date(shift.date as string),
              type: 'shift',
              color: shift.color || '#B064FF',
              allDay: false,
              description: shift.description,
            }));
            
            calendarEvents.push(...shiftEvents);
          }
          
          setEvents(calendarEvents);
        } else {
          setError(response.message || 'Failed to fetch events');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch events');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [user]);

  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDateStr = event.start.toISOString().split('T')[0];
      return eventDateStr === dateStr;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDayColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'bg-tangerine-100 text-tangerine-600';
      case 'shift':
        return 'bg-orchid-100 text-orchid-600';
      case 'task':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      
      days.push(
        <div
          key={`day-${day}`}
          className={`p-2 border border-gray-200 min-h-[100px] relative ${dayEvents.length > 0 ? 'bg-tangerine-50' : ''}`}
        >
          <div className="font-medium text-gray-800">{day}</div>
          {dayEvents.slice(0, 3).map((event, index) => (
            <div
              key={index}
              className={`mt-1 px-2 py-1 rounded text-xs truncate ${getDayColor(event.type)}`}
              onClick={() => setSelectedEvent(event)}
            >
              {event.title}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <div className="mt-1 px-2 py-1 rounded text-xs truncate bg-gray-100 text-gray-600">
              +{dayEvents.length - 3} more
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const renderWeekView = () => {
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayEvents = getEventsForDate(date);
      
      days.push(
        <div key={i} className="p-2 border border-gray-200 min-h-[150px]">
          <div className="font-medium text-gray-800">{weekDays[i]}</div>
          <div className="text-sm text-gray-500">{date.toLocaleDateString()}</div>
          {dayEvents.slice(0, 4).map((event, index) => (
            <div
              key={index}
              className={`mt-1 px-2 py-1 rounded text-xs truncate ${getDayColor(event.type)}`}
              onClick={() => setSelectedEvent(event)}
            >
              {event.title}
            </div>
          ))}
        </div>
      );
    }
    
    return days;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent mb-2">
          Calendar
        </h1>
        <p className="text-gray-500">View your events and shifts</p>
      </div>

      {/* Calendar Controls */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigateMonth('prev')} className="p-1.5">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-800">{getMonthName(currentDate)}</h2>
            <Button variant="ghost" onClick={() => navigateMonth('next')} className="p-1.5">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={view === 'month' ? 'solid' : 'outline'}
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'solid' : 'outline'}
              onClick={() => setView('week')}
            >
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'solid' : 'outline'}
              onClick={() => setView('day')}
            >
              Day
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Calendar Grid */}
      <Card className="p-4 mb-6">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-gray-600 bg-white">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && (
            <div className="col-span-7 p-4">
              <h3 className="font-semibold text-gray-800 mb-4">
                {currentDate.toLocaleDateString()}
              </h3>
              <div className="space-y-2">
                {getEventsForDate(currentDate).map((event, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${getDayColor(event.type)} cursor-pointer`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="font-medium text-gray-800">{event.title}</div>
                    <div className="text-sm text-gray-600">{event.start.toLocaleTimeString()}</div>
                    {event.location && (
                      <div className="text-sm text-gray-500">{event.location}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Event Legend */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-tangerine-500" />
            <span className="text-sm text-gray-600">Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orchid-500" />
            <span className="text-sm text-gray-600">Shifts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Tasks</span>
          </div>
        </div>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${getDayColor(selectedEvent.type)}`} />
                <h2 className="text-xl font-semibold text-gray-800">{selectedEvent.title}</h2>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedEvent(null)}
                className="p-1.5"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-800">{selectedEvent.start.toLocaleDateString()}</span>
              </div>
              
              {!selectedEvent.allDay && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-800">
                    {selectedEvent.start.toLocaleTimeString()} - {selectedEvent.end.toLocaleTimeString()}
                  </span>
                </div>
              )}
              
              {selectedEvent.location && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 text-gray-500">📍</div>
                  <span className="text-gray-800">{selectedEvent.location}</span>
                </div>
              )}
              
              {selectedEvent.capacity && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-800">
                    {selectedEvent.assignedCount || 0}/{selectedEvent.capacity} volunteers
                  </span>
                </div>
              )}
              
              {selectedEvent.description && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-4 mt-6">
              <Button onClick={() => setSelectedEvent(null)} className="flex-1">
                Close
              </Button>
              <Button variant="outline" className="flex-1">
                <Eye className="w-5 h-5 mr-2" />
                View Details
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CalendarPage;
