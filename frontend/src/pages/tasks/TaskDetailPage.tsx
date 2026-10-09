import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, User as UserIcon, Tag, CheckCircle, XCircle, ArrowLeft, 
  Edit, Trash2, PlayCircle, Clock as ClockIcon, FileText, MessageSquare,
  Paperclip, CheckSquare, Square, Building2
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Task, TaskStatus, TaskPriority, TaskType } from '../../types/task';
import { Event } from '../../types/event';
import { User } from '../../types/user';

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const [task, setTask] = useState<Task | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [volunteer, setVolunteer] = useState<UserIcon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.get<{ success: boolean; data: Task; message?: string }>(
        `/tasks/${id}`
      );
      
      if (response.success && response.data) {
        setTask(response.data);
        
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
        setError(response.message || 'Task not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch task');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [fetchTask, id]);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-gray-100 text-gray-600';
      case TaskStatus.ASSIGNED:
        return 'bg-blue-100 text-blue-600';
      case TaskStatus.IN_PROGRESS:
        return 'bg-orchid-100 text-orchid-600';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-600';
      case TaskStatus.CANCELLED:
        return 'bg-red-100 text-red-600';
      case TaskStatus.OVERDUE:
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'Pending';
      case TaskStatus.ASSIGNED:
        return 'Assigned';
      case TaskStatus.IN_PROGRESS:
        return 'In Progress';
      case TaskStatus.COMPLETED:
        return 'Completed';
      case TaskStatus.CANCELLED:
        return 'Cancelled';
      case TaskStatus.OVERDUE:
        return 'Overdue';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-green-100 text-green-600';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-600';
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-600';
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityText = (priority: TaskPriority) => {
    return priority;
  };

  const getTypeIcon = (type: TaskType) => {
    switch (type) {
      case TaskType.SETUP:
        return <Tag className="w-6 h-6" />;
      case TaskType.REGISTRATION:
        return <UserIcon className="w-6 h-6" />;
      case TaskType.COORDINATION:
        return <Building2 className="w-6 h-6" />;
      case TaskType.LOGISTICS:
        return <Tag className="w-6 h-6" />;
      case TaskType.TECHNICAL:
        return <Tag className="w-6 h-6" />;
      case TaskType.MARKETING:
        return <Tag className="w-6 h-6" />;
      case TaskType.CATERING:
        return <Tag className="w-6 h-6" />;
      case TaskType.CLEANUP:
        return <Trash2 className="w-6 h-6" />;
      case TaskType.SECURITY:
        return <Tag className="w-6 h-6" />;
      default:
        return <Tag className="w-6 h-6" />;
    }
  };

  const handleEdit = () => {
    if (task) {
      navigate(`/tasks/${task._id || task.taskId}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/tasks/${task._id || task.taskId}`
        );
        
        if (response.success) {
          navigate(role === 'ADMIN' ? '/admin/tasks' : '/organizer/tasks');
        } else {
          setError(response.message || 'Failed to delete task');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete task');
      }
    }
  };

  const handleStart = async () => {
    if (!task) return;
    
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `/tasks/${task._id || task.taskId}/start`
      );
      
      if (response.success) {
        fetchTask();
      } else {
        setError(response.message || 'Failed to start task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start task');
    }
  };

  const handleComplete = async () => {
    if (!task) return;
    
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `/tasks/${task._id || task.taskId}/complete`
      );
      
      if (response.success) {
        fetchTask();
      } else {
        setError(response.message || 'Failed to complete task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete task');
    }
  };

  const handleAssign = async (volunteerId: string) => {
    if (!task) return;
    
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `/tasks/${task._id || task.taskId}/assign`,
        { volunteerId }
      );
      
      if (response.success) {
        fetchTask();
      } else {
        setError(response.message || 'Failed to assign task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign task');
    }
  };

  const calculateProgress = () => {
    if (!task) return 0;
    if (task.checklists && task.checklists.length > 0) {
      const completed = task.checklists.filter(item => item.completed).length;
      return (completed / task.checklists.length) * 100;
    }
    return 0;
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
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error && !task) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="max-w-4xl mx-auto p-6 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to={role === 'ADMIN' ? '/admin/tasks' : role === 'ORGANIZER' ? '/organizer/tasks' : '/volunteer/tasks'}>
            <Button>
              <ArrowLeft className="w-5 h-5" />
              Back to Tasks
            </Button>
          </Link>
        </Card>
      </motion.div>
    );
  }

  if (!task) {
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
          <Link to={role === 'ADMIN' ? '/admin/tasks' : role === 'ORGANIZER' ? '/organizer/tasks' : '/volunteer/tasks'}>
            <span className="hover:text-tangerine-500">Tasks</span>
          </Link>
          <span>/</span>
          <span className="text-gray-800">{task.taskId}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-tangerine-100 to-orchid-100 rounded-lg flex items-center justify-center">
                {getTypeIcon(task.taskType || TaskType.OTHER)}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{task.title}</h1>
                <p className="text-gray-500">{task.taskId}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                {getStatusText(task.status)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                {getPriorityText(task.priority)} Priority
              </span>
              {task.taskType && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  {task.taskType}
                </span>
              )}
            </div>
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
          </div>
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Description</h2>
            <p className="text-gray-600 whitespace-pre-line">{task.description}</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Task Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tangerine-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-tangerine-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-800">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {task.startDate && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orchid-50 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-orchid-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium text-gray-800">
                      {new Date(task.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {task.endDate && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-apricot-50 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-medium text-gray-800">
                      {new Date(task.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {task.estimatedHours && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estimated Hours</p>
                    <p className="font-medium text-gray-800">{task.estimatedHours} hours</p>
                  </div>
                </div>
              )}

              {task.actualHours && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Actual Hours</p>
                    <p className="font-medium text-gray-800">{task.actualHours} hours</p>
                  </div>
                </div>
              )}

              {task.location && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tangerine-50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-tangerine-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-800">{task.location}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Event Information */}
        {event && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Related Event</h2>
            
            <div className="flex items-center gap-4">
              {event.image && (
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                <p className="text-gray-500 text-sm">{event.eventId}</p>
                
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    {event.startTime} - {event.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4" />
                    {event.requiredVolunteers} volunteers needed
                  </span>
                </div>
              </div>
              
              <Link to={`/events/${event._id || event.eventId}`}>
                <Button variant="outline">
                  View Event
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Volunteer Information */}
        {volunteer && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Assigned Volunteer</h2>
            
            <div className="flex items-center gap-4">
              {volunteer.profile?.profileImage && (
                <img
                  src={volunteer.profile.profileImage}
                  alt={volunteer.fullName}
                  className="w-16 h-16 object-cover rounded-full"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{volunteer.fullName}</h3>
                <p className="text-gray-500 text-sm">{volunteer.email}</p>
                
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  <span>Role: {volunteer.role}</span>
                  {volunteer.performanceScore && (
                    <span>Score: {volunteer.performanceScore}/100</span>
                  )}
                  {volunteer.totalVolunteerHours && (
                    <span>Hours: {volunteer.totalVolunteerHours}</span>
                  )}
                </div>
              </div>
              
              {role === 'ADMIN' || role === 'ORGANIZER' ? (
                <Button
                  variant="outline"
                  onClick={() => handleAssign('')}
                  className="text-orange-500"
                >
                  Reassign
                </Button>
              ) : null}
            </div>
          </Card>
        )}

        {/* Requirements */}
        {task.requirements && task.requirements.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Requirements</h2>
            
            <div className="space-y-3">
              {task.requirements.map((req, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  {req.skill && (
                    <div className="flex items-center gap-2">
                      <span className="text-orchid-500">🎯</span>
                      <span className="font-medium">{req.skill}</span>
                    </div>
                  )}
                  {req.experienceLevel && (
                    <p className="text-sm text-gray-600">Experience: {req.experienceLevel}</p>
                  )}
                  {req.certification && (
                    <p className="text-sm text-gray-600">Certification: {req.certification}</p>
                  )}
                  {req.equipment && (
                    <p className="text-sm text-gray-600">Equipment: {req.equipment}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Checklist */}
        {task.checklists && task.checklists.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Checklist</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {task.checklists.filter(item => item.completed).length}/{task.checklists.length} completed
                </span>
                <div className="w-20 h-2 bg-gray-200 rounded-full">
                  <div
                    className="bg-gradient-to-r from-tangerine-500 to-orchid-500 h-2 rounded-full"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {task.checklists.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${item.completed ? 'bg-green-50' : 'bg-gray-50'}`}
                >
                  <button className="p-1">
                    {item.completed ? (
                      <CheckSquare className="w-5 h-5 text-green-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-800'}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Comments */}
        {task.comments && task.comments.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Comments</h2>
            
            <div className="space-y-4">
              {task.comments.map((comment, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <UserIcon className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-800">{comment.postedBy}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.postedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600">{comment.comment}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Attachments</h2>
            
            <div className="space-y-3">
              {task.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tangerine-500 hover:underline"
                  >
                    {attachment.filename}
                  </a>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        {(role === 'VOLUNTEER' && task.status === TaskStatus.ASSIGNED) && (
          <div className="flex gap-2">
            <Button
              onClick={handleStart}
              className="flex-1 bg-gradient-to-r from-tangerine-500 to-orchid-500"
            >
              <PlayCircle className="w-5 h-5" />
              Start Task
            </Button>
          </div>
        )}

        {(role === 'VOLUNTEER' && task.status === TaskStatus.IN_PROGRESS) && (
          <div className="flex gap-2">
            <Button
              onClick={handleComplete}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
            >
              <CheckCircle className="w-5 h-5" />
              Complete Task
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TaskDetailPage;
