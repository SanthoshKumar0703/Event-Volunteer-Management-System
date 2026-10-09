import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Mail, Phone, Building, MapPin, Save, Plus, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { CreateEventRequest, EventCategory } from '../../types/eventRequest';

const EventRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<CreateEventRequest>({
    eventName: '',
    organizationName: '',
    contactPerson: user?.firstName || '',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
    category: 'COMMUNITY',
    description: '',
    venue: '',
    venueAddress: '',
    venueCity: '',
    venueState: '',
    venuePostalCode: '',
    venueCountry: '',
    eventDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    expectedAttendees: 0,
    requiredVolunteers: 1,
    requiredSkills: [],
    additionalRequirements: '',
    budget: 0,
    website: '',
    socialMediaLinks: [],
  });
  
  const [skillInput, setSkillInput] = useState('');
  const [socialInput, setSocialInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactPerson: user.firstName + ' ' + user.lastName,
        contactEmail: user.email,
        contactPhone: user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillInput(e.target.value);
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skill)
    }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSocialInput(e.target.value);
  };

  const handleAddSocial = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && socialInput.trim() && !formData.socialMediaLinks.includes(socialInput.trim())) {
      setFormData(prev => ({
        ...prev,
        socialMediaLinks: [...prev.socialMediaLinks, socialInput.trim()]
      }));
      setSocialInput('');
    }
  };

  const handleRemoveSocial = (link: string) => {
    setFormData(prev => ({
      ...prev,
      socialMediaLinks: prev.socialMediaLinks.filter(s => s !== link)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate required fields
      if (!formData.eventName || !formData.organizationName || !formData.contactPerson || 
          !formData.contactEmail || !formData.category || !formData.eventDate ||
          !formData.startTime || !formData.endTime) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
        setError('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }
      
      // Validate time format
      if (!/^\d{2}:\d{2}$/.test(formData.startTime) || !/^\d{2}:\d{2}$/.test(formData.endTime)) {
        setError('Please use HH:mm format for times');
        setIsSubmitting(false);
        return;
      }
      
      const response = await apiService.post<{ success: boolean; data: any; message?: string }>(
        '/event-requests',
        formData
      );
      
      if (response.success) {
        setSuccess('Event request submitted successfully! We will review it shortly.');
        setTimeout(() => {
          navigate('/event-requests');
        }, 2000);
      } else {
        setError(response.message || 'Failed to submit event request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit event request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: EventCategory[] = [
    'CONFERENCE', 'CONCERT', 'FESTIVAL', 'SPORTS', 'CHARITY',
    'COMMUNITY', 'CORPORATE', 'EDUCATION', 'HEALTH', 'ENVIRONMENT',
    'ARTS', 'TECHNOLOGY', 'FOOD', 'OTHER'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/event-requests')} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent">
          Request New Event
        </h1>
      </div>

      <Card className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Event Name *"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                placeholder="Enter event name..."
                required
              />
              
              <Input
                label="Category *"
                name="category"
                type="select"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Input>
            </div>
            
            <div className="mt-4">
              <Input
                label="Description *"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event..."
                multiline
                rows={4}
                required
              />
            </div>
          </div>

          {/* Organization Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Organization Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Organization Name *"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Enter organization name..."
                required
              />
              
              <Input
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contact Person *"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="Enter contact person name..."
                required
              />
              
              <Input
                label="Email *"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="Enter email..."
                required
              />
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone *"
                name="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="Enter phone number..."
                required
              />
              
              <Input
                label="Budget (Optional)"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                placeholder="Enter estimated budget"
                min={0}
              />
            </div>
          </div>

          {/* Event Details */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Date *"
                name="eventDate"
                type="date"
                value={formData.eventDate}
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
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Expected Attendees"
                name="expectedAttendees"
                type="number"
                value={formData.expectedAttendees}
                onChange={handleChange}
                placeholder="Number of expected attendees"
                min={0}
              />
              
              <Input
                label="Required Volunteers *"
                name="requiredVolunteers"
                type="number"
                value={formData.requiredVolunteers}
                onChange={handleChange}
                placeholder="Number of volunteers needed"
                min={1}
                required
              />
            </div>
          </div>

          {/* Venue Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Venue Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Venue Name *"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="Enter venue name..."
                required
              />
              
              <Input
                label="Address"
                name="venueAddress"
                value={formData.venueAddress}
                onChange={handleChange}
                placeholder="Street address"
              />
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                name="venueCity"
                value={formData.venueCity}
                onChange={handleChange}
                placeholder="City"
              />
              
              <Input
                label="State"
                name="venueState"
                value={formData.venueState}
                onChange={handleChange}
                placeholder="State"
              />
              
              <Input
                label="Postal Code"
                name="venuePostalCode"
                value={formData.venuePostalCode}
                onChange={handleChange}
                placeholder="Postal Code"
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Country"
                name="venueCountry"
                value={formData.venueCountry}
                onChange={handleChange}
                placeholder="Country"
              />
            </div>
          </div>

          {/* Requirements */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Requirements</h2>
            
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-5 h-5 text-tangerine-500" />
              <input
                type="text"
                value={skillInput}
                onChange={handleSkillChange}
                onKeyDown={handleAddSkill}
                placeholder="Add required skill and press Enter..."
                className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
              />
            </div>
            
            {formData.requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-tangerine-100 text-tangerine-600 rounded-full text-sm flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-tangerine-500 hover:text-tangerine-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            <Input
              label="Additional Requirements"
              name="additionalRequirements"
              value={formData.additionalRequirements}
              onChange={handleChange}
              placeholder="Any additional requirements for volunteers..."
              multiline
              rows={3}
            />
          </div>

          {/* Social Media Links */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Social Media Links</h2>
            
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-5 h-5 text-orchid-500" />
              <input
                type="text"
                value={socialInput}
                onChange={handleSocialChange}
                onKeyDown={handleAddSocial}
                placeholder="Add social media link and press Enter..."
                className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
              />
            </div>
            
            {formData.socialMediaLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.socialMediaLinks.map((link, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-orchid-100 text-orchid-600 rounded-full text-sm flex items-center gap-2"
                  >
                    {link}
                    <button
                      type="button"
                      onClick={() => handleRemoveSocial(link)}
                      className="text-orchid-500 hover:text-orchid-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
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
            <Button type="button" variant="outline" onClick={() => navigate('/event-requests')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-5 h-5 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};

export default EventRequestPage;
