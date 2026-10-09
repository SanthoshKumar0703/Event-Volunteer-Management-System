import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Tag, Plus, X, Save, ArrowLeft,
  Building2, FileText, Paperclip, CheckSquare, Square
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Task, TaskType, TaskPriority, TaskStatus } from '../../types/task';
import { Event } from '../../types/event';
import { User } from '../../types/user';

const TaskEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const [task, setTask] = useState<Task | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: TaskType.OTHER,
    priority: TaskPriority.MEDIUM,
    eventId: '',
    volunteerId: '',
    dueDate: '',
    startDate: '',
    endDate: '',
    estimatedHours: 1,
    location: '',
    requirements: [] as { skill?: string; experienceLevel?: string; certification?: string; equipment?: string }[],
    checklists: [] as { name: string; completed: boolean }[],
    attachments: [] as { filename: string; url: string }[]
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requirementInput, setRequirementInput] = useState({ skill: '', experienceLevel: '', certification: '', equipment: '' });
  const [checklistInput, setChecklistInput] = useState('');

  const fetchTask = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await apiService.get<{ success: boolean; data: Task; message?: string }>(
        `/tasks/${id}`
      );
      
      if (response.success && response.data) {
        const taskData = response.data;
        setTask(taskData);
        
        // Set form data
        setFormData({
          title: taskData.title || '',
          description: taskData.description || '',
          taskType: taskData.taskType || TaskType.OTHER,
          priority: taskData.priority || TaskPriority.MEDIUM,
          eventId: taskData.eventId || '',
          volunteerId: taskData.volunteerId || '',
          dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
          startDate: taskData.startDate ? new Date(taskData.startDate).toISOString().split('T')[0] : '',
          endDate: taskData.endDate ? new Date(taskData.endDate).toISOString().split('T')[0] : '',
          estimatedHours: taskData.estimatedHours || 1,
          location: taskData.location || '',
          requirements: taskData.requirements || [],
          checklists: taskData.checklists || [],
          attachments: taskData.attachments || []
        });
        
        // Fetch related event
        if (taskData.eventId) {
          const eventResponse = await apiService.get<{ success: boolean; data: Event }>(
            `/events/${taskData.eventId}`
          );
          if (eventResponse.success) {
            setEvent(eventResponse.data);
          }
        }
        
        // Fetch volunteers
        if (role === 'ORGANIZER' && user?._id) {
          const volunteersResponse = await apiService.get<{ success: boolean; data: User[] }>(
            `/users?role=VOLUNTEER`
          );
          if (volunteersResponse.success) {
            setVolunteers(volunteersResponse.data || []);
          }
        }
      } else {
        setErrors(prev => ({ ...prev, general: response.message || 'Task not found' }));
      }
    } catch (err: any) {
      setErrors(prev => ({ ...prev, general: err.message || 'Failed to fetch task' }));
    } finally {
      setIsLoading(false);
    }
  }, [id, role, user?._id]);

  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [fetchTask, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRequirementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRequirementInput(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRequirement = () => {
    if (requirementInput.skill || requirementInput.experienceLevel || requirementInput.certification || requirementInput.equipment) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, { ...requirementInput }]
      }));
      setRequirementInput({ skill: '', experienceLevel: '', certification: '', equipment: '' });
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleAddChecklist = () => {
    if (checklistInput.trim()) {
      setFormData(prev => ({
        ...prev,
        checklists: [...prev.checklists, { name: checklistInput.trim(), completed: false }]
      }));
      setChecklistInput('');
    }
  };

  const handleRemoveChecklist = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklists: prev.checklists.filter((_, i) => i !== index)
    }));
  };

  const handleToggleChecklist = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklists: prev.checklists.map((item, i) => 
        i === index ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.eventId) {
      newErrors.eventId = 'Event is required';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      const taskData = {
        ...formData,
        status: task?.status || TaskStatus.PENDING
      };
      
      const response = await apiService.put<{ success: boolean; message: string; data: Task }>(
        `/tasks/${id}`,
        taskData
      );
      
      if (response.success) {
        navigate(`/tasks/${response.data._id || response.data.taskId}`);
      } else {
        setErrors(prev => ({ ...prev, general: response.message || 'Failed to update task' }));
      }
    } catch (err: any) {
      setErrors(prev => ({ ...prev, general: err.message || 'Failed to update task' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${formData.title}"?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/tasks/${id}`
        );
        
        if (response.success) {
          navigate(role === 'ADMIN' ? '/admin/tasks' : '/organizer/tasks');
        } else {
          setErrors(prev => ({ ...prev, general: response.message || 'Failed to delete task' }));
        }
      } catch (err: any) {
        setErrors(prev => ({ ...prev, general: err.message || 'Failed to delete task' }));
      }
    }
  };

  const taskTypes = [
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

  const priorities = [
    TaskPriority.LOW,
    TaskPriority.MEDIUM,
    TaskPriority.HIGH,
    TaskPriority.URGENT
  ];

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

  if (errors.general && !task) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="max-w-4xl mx-auto p-6 text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Not Found</h2>
          <p className="text-gray-600 mb-6">{errors.general}</p>
          <Button onClick={handleCancel}>
            <ArrowLeft className="w-5 h-5" />
            Back to Tasks
          </Button>
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="w-5 h-5" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent mb-2">
                Edit Task
              </h1>
              <p className="text-gray-500">Update task details</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="bg-gradient-to-r from-tangerine-500 to-orchid-500"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </Button>
            {(role === 'ADMIN' || role === 'ORGANIZER') && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-600"
              >
                Delete Task
              </Button>
            )}
          </div>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
            {errors.general}
          </div>
        )}

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
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                <p className="text-gray-500 text-sm">{event.eventId}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Basic Information */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <Input
              label="Task Title"
              name="title"
              placeholder="Enter task title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                placeholder="Enter task description..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full p-3 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none transition-colors resize-none`}
                required
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Type
                </label>
                <select
                  name="taskType"
                  value={formData.taskType}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none transition-colors"
                >
                  {taskTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none transition-colors"
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Assignment */}
        {(role === 'ADMIN' || role === 'ORGANIZER') && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Assignment</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Volunteer
                </label>
                <select
                  name="volunteerId"
                  value={formData.volunteerId}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none transition-colors"
                >
                  <option value="">Unassigned</option>
                  {volunteers.map(volunteer => (
                    <option key={volunteer._id} value={volunteer._id}>
                      {volunteer.fullName} ({volunteer.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Date & Time */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Date & Time</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              error={errors.dueDate}
              required
            />
            
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Start Time"
              name="startTime"
              type="time"
              value={formData.startDate ? new Date(formData.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              onChange={handleChange}
            />
            
            <Input
              label="End Time"
              name="endTime"
              type="time"
              value={formData.endDate ? new Date(formData.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              onChange={handleChange}
            />
          </div>

          <div className="mt-4">
            <Input
              label="Estimated Hours"
              name="estimatedHours"
              type="number"
              min={0.5}
              step={0.5}
              value={formData.estimatedHours}
              onChange={handleChange}
            />
          </div>
        </Card>

        {/* Location */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Location</h2>
          
          <Input
            label="Location"
            name="location"
            placeholder="Where should this task be performed?"
            value={formData.location}
            onChange={handleChange}
            icon={<Building2 className="w-5 h-5 text-gray-400" />}
          />
        </Card>

        {/* Requirements */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Requirements</h2>
          
          <div className="space-y-4">
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  {req.skill && <span className="font-medium">{req.skill}</span>}
                  {req.experienceLevel && <span className="text-sm text-gray-600"> - {req.experienceLevel}</span>}
                  {req.certification && <span className="text-sm text-gray-600"> - {req.certification}</span>}
                  {req.equipment && <span className="text-sm text-gray-600"> - {req.equipment}</span>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveRequirement(index)}
                  className="p-1 text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input
                placeholder="Skill"
                value={requirementInput.skill}
                onChange={handleRequirementChange}
                name="skill"
              />
              <Input
                placeholder="Experience Level"
                value={requirementInput.experienceLevel}
                onChange={handleRequirementChange}
                name="experienceLevel"
              />
              <Input
                placeholder="Certification"
                value={requirementInput.certification}
                onChange={handleRequirementChange}
                name="certification"
              />
              <Input
                placeholder="Equipment"
                value={requirementInput.equipment}
                onChange={handleRequirementChange}
                name="equipment"
              />
            </div>
            
            <Button onClick={handleAddRequirement} variant="outline" className="w-full">
              <Plus className="w-5 h-5" />
              Add Requirement
            </Button>
          </div>
        </Card>

        {/* Checklist */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Checklist</h2>
          
          <div className="space-y-3">
            {formData.checklists.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={() => handleToggleChecklist(index)}
                  className="p-1"
                >
                  {item.completed ? (
                    <CheckSquare className="w-5 h-5 text-green-500" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-800'}>
                  {item.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveChecklist(index)}
                  className="p-1 text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <div className="flex gap-2">
              <Input
                placeholder="Add checklist item"
                value={checklistInput}
                onChange={(e) => setChecklistInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
              />
              <Button onClick={handleAddChecklist}>
                <Plus className="w-5 h-5" />
                Add
              </Button>
            </div>
          </div>
        </Card>

        {/* Attachments */}
        {formData.attachments.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Attachments</h2>
            
            <div className="space-y-3">
              {formData.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-800">{attachment.filename}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        attachments: prev.attachments.filter((_, i) => i !== index)
                      }));
                    }}
                    className="p-1 text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="bg-gradient-to-r from-tangerine-500 to-orchid-500"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskEditPage;
