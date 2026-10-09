import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Users, Tag, Building2, Globe2, 
  Mail, Phone, Plus, X, Image as ImageIcon, Save, ArrowLeft
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Event, EventCategory, EventStatus } from '../../types/event';

interface FormData {
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  requiredVolunteers: number;
  maximumVolunteers: number;
  contactEmail: string;
  contactPhone: string;
  tags: string[];
  image: string;
  status: EventStatus;
}

const EventEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: EventCategory.CONFERENCE,
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    venue: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    requiredVolunteers: 5,
    maximumVolunteers: 50,
    contactEmail: user?.email || '',
    contactPhone: '',
    tags: [],
    image: '',
    status: EventStatus.DRAFT
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const categories = [
    EventCategory.CONFERENCE, EventCategory.CONCERT, EventCategory.FESTIVAL,
    EventCategory.SPORTS, EventCategory.CHARITY, EventCategory.COMMUNITY,
    EventCategory.CORPORATE, EventCategory.EDUCATION, EventCategory.HEALTH,
    EventCategory.ENVIRONMENT, EventCategory.ARTS, EventCategory.TECHNOLOGY,
    EventCategory.FOOD, EventCategory.OTHER
  ];

  const statuses = [
    EventStatus.DRAFT,
    EventStatus.PENDING,
    EventStatus.OPEN_FOR_REGISTRATION,
    EventStatus.UPCOMING,
    EventStatus.LIVE,
    EventStatus.COMPLETED,
    EventStatus.CANCELLED
  ];

  const fetchEvent = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await apiService.get<{ success: boolean; data: Event; message?: string }>(
        `/events/${id}`
      );
      
      if (response.success && response.data) {
        const event = response.data;
        setFormData({
          title: event.title || '',
          description: event.description || '',
          category: event.category || EventCategory.CONFERENCE,
          date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
          startTime: event.startTime || '09:00',
          endTime: event.endTime || '17:00',
          registrationDeadline: event.registrationDeadline 
            ? new Date(event.registrationDeadline).toISOString().split('T')[0]
            : '',
          venue: event.location?.venue || '',
          address: event.location?.address || '',
          city: event.location?.city || '',
          state: event.location?.state || '',
          postalCode: event.location?.postalCode || '',
          country: event.location?.country || '',
          requiredVolunteers: event.requiredVolunteers || 5,
          maximumVolunteers: event.maximumVolunteers || 50,
          contactEmail: event.contactEmail || '',
          contactPhone: event.contactPhone || '',
          tags: event.tags || [],
          image: event.image || '',
          status: event.status || EventStatus.DRAFT
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch event:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [fetchEvent, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(t => t !== tag) 
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email';
    }
    if (formData.requiredVolunteers < 1) {
      newErrors.requiredVolunteers = 'At least 1 volunteer is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      const eventData = {
        ...formData,
        location: {
          venue: formData.venue,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country
        },
        socialLinks: {},
        settings: {}
      };
      
      const response = await apiService.put<{ success: boolean; message: string; data: Event }>(
        `/events/${id}`,
        eventData
      );
      
      if (response.success) {
        navigate(`/events/${response.data._id || response.data.eventId}`);
      } else {
        setErrors(prev => ({ ...prev, general: response.message || 'Failed to update event' }));
      }
    } catch (err: any) {
      setErrors(prev => ({ ...prev, general: err.message || 'Failed to update event' }));
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
          `/events/${id}`
        );
        
        if (response.success) {
          navigate(role === 'ADMIN' ? '/admin/events' : '/organizer/events');
        }
      } catch (err: any) {
        setErrors(prev => ({ ...prev, general: err.message || 'Failed to delete event' }));
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
                Edit Event
              </h1>
              <p className="text-gray-500">Update your event details</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600"
            >
              Delete Event
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

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
            {errors.general}
          </div>
        )}

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <Input
              label="Event Title"
              name="title"
              placeholder="Enter event title"
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
                placeholder="Enter event description..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full p-3 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none transition-colors resize-none`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none transition-colors"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none transition-colors"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Required Volunteers"
                  name="requiredVolunteers"
                  type="number"
                  min={1}
                  value={formData.requiredVolunteers}
                  onChange={handleChange}
                  error={errors.requiredVolunteers}
                  required
                />
                <Input
                  label="Maximum Volunteers"
                  name="maximumVolunteers"
                  type="number"
                  min={formData.requiredVolunteers}
                  value={formData.maximumVolunteers}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Date & Time</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Event Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              error={errors.date}
              required
            />
            <Input
              label="Registration Deadline"
              name="registrationDeadline"
              type="date"
              value={formData.registrationDeadline}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Start Time"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
            />
            <Input
              label="End Time"
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Location</h2>
          
          <div className="space-y-4">
            <Input
              label="Venue"
              name="venue"
              placeholder="Enter venue name"
              value={formData.venue}
              onChange={handleChange}
              error={errors.venue}
              required
              icon={<Building2 className="w-5 h-5 text-gray-400" />}
            />

            <Input
              label="Address"
              name="address"
              placeholder="Street address"
              value={formData.address}
              onChange={handleChange}
              icon={<MapPin className="w-5 h-5 text-gray-400" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
              />
              <Input
                label="State/Province"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
              />
              <Input
                label="Postal Code"
                name="postalCode"
                placeholder="Postal Code"
                value={formData.postalCode}
                onChange={handleChange}
              />
            </div>

            <Input
              label="Country"
              name="country"
              placeholder="Country"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Email"
              name="contactEmail"
              type="email"
              placeholder="Contact email"
              value={formData.contactEmail}
              onChange={handleChange}
              error={errors.contactEmail}
              required
              icon={<Mail className="w-5 h-5 text-gray-400" />}
            />
            <Input
              label="Contact Phone"
              name="contactPhone"
              type="tel"
              placeholder="Contact phone"
              value={formData.contactPhone}
              onChange={handleChange}
              icon={<Phone className="w-5 h-5 text-gray-400" />}
            />
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Tags</h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-tangerine-100 text-tangerine-600 rounded-full text-sm flex items-center gap-1"
              >
                {tag}
                <button
                  onClick={() => handleTagRemove(tag)}
                  className="hover:text-tangerine-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
            <Button onClick={handleTagAdd} size="sm">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Image</h2>
          
          <div className="flex items-center gap-4">
            {formData.image ? (
              <img
                src={formData.image}
                alt="Event"
                className="w-24 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1">
              <Input
                label="Image URL"
                name="image"
                placeholder="Enter image URL"
                value={formData.image}
                onChange={handleChange}
              />
              <p className="text-sm text-gray-500 mt-1">
                Provide a URL to an image for your event
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-2 mt-6">
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

export default EventEditPage;
