import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Tag, Pin, Save, Upload, Plus, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Announcement, UpdateAnnouncement, AnnouncementPriority, AnnouncementStatus } from '../../types/announcement';

const AnnouncementEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<UpdateAnnouncement & { eventId: string }>({
    eventId: '',
    title: '',
    message: '',
    content: '',
    priority: 'MEDIUM',
    status: 'DRAFT',
    tags: [],
    isPinned: false,
    attachments: [],
  });
  
  const [tagInput, setTagInput] = useState('');
  const [events, setEvents] = useState<{ _id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch announcement
        const announcementResponse = await apiService.get<{ success: boolean; data: Announcement; message?: string }>(
          `/announcements/${id}`
        );
        
        if (announcementResponse.success) {
          const announcement = announcementResponse.data;
          setFormData({
            eventId: announcement.event as string,
            title: announcement.title,
            message: announcement.message,
            content: announcement.content || '',
            priority: announcement.priority,
            status: announcement.status,
            tags: announcement.tags || [],
            isPinned: announcement.isPinned,
            attachments: announcement.attachments || [],
            scheduledAt: announcement.scheduledAt as string || '',
            expiresAt: announcement.expiresAt as string || '',
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
    const checked = (e.target as HTMLInputElement).checked;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate required fields
      if (!formData.title || !formData.message || !formData.eventId) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      const response = await apiService.put<{ success: boolean; data: any; message?: string }>(
        `/announcements/${id}`,
        formData
      );
      
      if (response.success) {
        setSuccess('Announcement updated successfully!');
        setTimeout(() => {
          navigate(`/announcements/${id}`);
        }, 1500);
      } else {
        setError(response.message || 'Failed to update announcement');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update announcement');
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
        <Button variant="ghost" onClick={() => navigate(`/announcements/${id}`)} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent">
          Edit Announcement
        </h1>
      </div>

      <Card className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <Input
                label="Priority"
                name="priority"
                type="select"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Input>
            </div>
            
            <div className="mt-4">
              <Input
                label="Title *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter announcement title..."
                required
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Message *"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Enter a brief message..."
                multiline
                rows={3}
                required
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Content (Optional)"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Enter detailed content (supports HTML)..."
                multiline
                rows={5}
              />
            </div>
          </div>

          {/* Settings */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Status"
                name="status"
                type="select"
                value={formData.status as AnnouncementStatus}
                onChange={handleChange}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </Input>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  name="isPinned"
                  checked={formData.isPinned}
                  onChange={handleChange}
                  className="w-4 h-4 text-tangerine-500 rounded focus:ring-tangerine-500"
                />
                <label htmlFor="isPinned" className="text-gray-700 cursor-pointer">
                  Pin this announcement
                </label>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Scheduled Date (Optional)"
                name="scheduledAt"
                type="date"
                value={formData.scheduledAt as string || ''}
                onChange={handleChange}
              />
              
              <Input
                label="Expiry Date (Optional)"
                name="expiresAt"
                type="date"
                value={formData.expiresAt as string || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tags</h2>
            
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={tagInput}
                onChange={handleTagChange}
                onKeyDown={handleAddTag}
                placeholder="Add a tag and press Enter..."
                className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
              />
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-tangerine-100 text-tangerine-600 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-tangerine-500 hover:text-tangerine-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Attachments</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">Drag & drop files here or click to browse</p>
              <Button variant="outline" type="button">
                Select Files
              </Button>
            </div>
            
            {formData.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-tangerine-100 rounded flex items-center justify-center">
                        <span className="text-tangerine-600 text-xs font-medium">PDF</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{attachment.fileName}</p>
                        <p className="text-gray-500 text-xs">{(attachment.fileSize / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
            <Button type="button" variant="outline" onClick={() => navigate(`/announcements/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-5 h-5 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};

export default AnnouncementEditPage;
