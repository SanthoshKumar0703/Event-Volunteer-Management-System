import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Filter, Plus, Eye, Edit, Trash2, CheckCircle, XCircle, 
  Clock, User as UserIcon, Tag, Calendar, ArrowLeft
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Task, TaskStatus, TaskPriority, TaskType } from '../../types/task';
import { Event } from '../../types/event';

interface TaskListPageProps {
  role: 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER';
}

const TaskListPage: React.FC<TaskListPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '/tasks';
      
      if (role === 'ORGANIZER' && user?._id) {
        // Get organizer's events first
        const eventsResponse = await apiService.get<{ success: boolean; data: Event[] }>(
          `/events?organizer=${user._id}`
        );
        
        if (eventsResponse.success) {
          setEvents(eventsResponse.data || []);
          const eventIds = eventsResponse.data.map(e => e._id || e.eventId).join(',');
          url = `/tasks?eventIds=${eventIds}`;
        }
      } else if (role === 'VOLUNTEER' && user?._id) {
        url = `/tasks?volunteerId=${user._id}`;
      }
      
      const response = await apiService.get<{ success: boolean; data: Task[]; message?: string }>(url);
      
      if (response.success) {
        setTasks(response.data || []);
        setFilteredTasks(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch tasks');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  }, [role, user?._id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    // Apply filters
    let filtered = [...tasks];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.taskId?.toLowerCase().includes(query) ||
        task.taskType?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }
    
    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(task => task.taskType === typeFilter);
    }
    
    setFilteredTasks(filtered);
  }, [tasks, searchQuery, statusFilter, priorityFilter, typeFilter]);

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
        return <Tag className="w-4 h-4" />;
      case TaskType.REGISTRATION:
        return <UserIcon className="w-4 h-4" />;
      case TaskType.COORDINATION:
        return <Calendar className="w-4 h-4" />;
      case TaskType.LOGISTICS:
        return <Tag className="w-4 h-4" />;
      case TaskType.TECHNICAL:
        return <Tag className="w-4 h-4" />;
      case TaskType.MARKETING:
        return <Tag className="w-4 h-4" />;
      case TaskType.CATERING:
        return <Tag className="w-4 h-4" />;
      case TaskType.CLEANUP:
        return <Trash2 className="w-4 h-4" />;
      case TaskType.SECURITY:
        return <Tag className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const getEventById = (eventId: string) => {
    return events.find(e => e._id === eventId || e.eventId === eventId);
  };

  const handleView = (task: Task) => {
    navigate(`/tasks/${task._id || task.taskId}`);
  };

  const handleEdit = (task: Task) => {
    navigate(`/tasks/${task._id || task.taskId}/edit`);
  };

  const handleDelete = async (task: Task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/tasks/${task._id || task.taskId}`
        );
        
        if (response.success) {
          fetchTasks();
        } else {
          setError(response.message || 'Failed to delete task');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete task');
      }
    }
  };

  const handleCreate = () => {
    navigate('/tasks/create');
  };

  const handleStart = async (task: Task) => {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `/tasks/${task._id || task.taskId}/start`
      );
      
      if (response.success) {
        fetchTasks();
      } else {
        setError(response.message || 'Failed to start task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start task');
    }
  };

  const handleComplete = async (task: Task) => {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `/tasks/${task._id || task.taskId}/complete`
      );
      
      if (response.success) {
        fetchTasks();
      } else {
        setError(response.message || 'Failed to complete task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete task');
    }
  };

  const statuses = [
    TaskStatus.PENDING,
    TaskStatus.ASSIGNED,
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
    TaskStatus.CANCELLED,
    TaskStatus.OVERDUE
  ];

  const priorities = [
    TaskPriority.LOW,
    TaskPriority.MEDIUM,
    TaskPriority.HIGH,
    TaskPriority.URGENT
  ];

  const types = [
    TaskType.SETUP,
    TaskType.REGISTRATION,
    TaskType.COORDINATION,
    TaskType.LOGISTICS,
    TaskType.TECHNICAL,
    TaskType.MARKETING,
    TaskType.CATERING,
    TaskType.CLEANUP,
    TaskType.SECURITY,
    TaskType.OTHER
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
            Tasks
          </h1>
          <p className="text-gray-500">
            {role === 'ADMIN' ? 'Manage all tasks' : 
             role === 'ORGANIZER' ? 'Manage tasks for your events' : 
             'Your assigned tasks'}
          </p>
        </div>
        
        {(role === 'ADMIN' || role === 'ORGANIZER') && (
          <Button onClick={handleCreate} className="self-start lg:self-center">
            <Plus className="w-5 h-5" />
            Create Task
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
              placeholder="Search tasks..."
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
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
            >
              <option value="">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority} value={priority}>{getPriorityText(priority)}</option>
              ))}
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
            >
              <option value="">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('');
                setPriorityFilter('');
                setTypeFilter('');
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
        <div className="grid grid-cols-1 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        /* Tasks List */
        <>
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Tasks Found</h3>
              <p className="text-gray-500">
                {role === 'VOLUNTEER' 
                  ? 'You have not been assigned any tasks yet.'
                  : 'There are no tasks created yet.'}
              </p>
              
              {(role === 'ADMIN' || role === 'ORGANIZER') && (
                <Button onClick={handleCreate} className="mt-6">
                  <Plus className="w-5 h-5" />
                  Create Your First Task
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredTasks.map((task, index) => {
                const event = getEventById(task.eventId || '');
                
                return (
                  <motion.div
                    key={task._id || task.taskId || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-tangerine-100 to-orchid-100 rounded-lg flex items-center justify-center">
                              {getTypeIcon(task.taskType || TaskType.OTHER)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{task.title}</h3>
                              <p className="text-sm text-gray-500">{task.taskId}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {getPriorityText(task.priority)}
                            </span>
                            {task.taskType && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                {task.taskType}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-500 text-sm line-clamp-1 mb-2">{task.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            {event && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {event.title}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {task.volunteerId && (
                              <span className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                Assigned to: {task.volunteerId}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 self-start sm:self-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(task)}
                            className="p-1.5"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {(role === 'ADMIN' || role === 'ORGANIZER') && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(task)}
                                className="p-1.5"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(task)}
                                className="p-1.5 text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          
                          {role === 'VOLUNTEER' && task.status === TaskStatus.ASSIGNED && (
                            <Button
                              size="sm"
                              onClick={() => handleStart(task)}
                              className="bg-orchid-500 hover:bg-orchid-600"
                            >
                              Start
                            </Button>
                          )}
                          
                          {role === 'VOLUNTEER' && task.status === TaskStatus.IN_PROGRESS && (
                            <Button
                              size="sm"
                              onClick={() => handleComplete(task)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default TaskListPage;
