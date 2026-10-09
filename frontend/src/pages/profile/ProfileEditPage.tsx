import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Save, Camera, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER';
  avatar?: string;
  bio?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  dateOfBirth?: string;
  skills?: string[];
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<UserProfile>({
    _id: user?._id || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'VOLUNTEER',
    avatar: user?.avatar || '',
    bio: user?.bio || '',
    address: user?.address || {},
    dateOfBirth: user?.dateOfBirth || '',
    skills: user?.skills || [],
    socialLinks: user?.socialLinks || {},
  });
  
  const [skillInput, setSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user?.avatar) {
      setAvatarPreview(user.avatar);
    }
  }, [user?.avatar]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else if (name.startsWith('socialLinks.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillInput(e.target.value);
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
        setFormData(prev => ({
          ...prev,
          avatar: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      const response = await apiService.put<{ success: boolean; data: UserProfile; message?: string }>(
        `/users/${user?._id}`,
        formData
      );
      
      if (response.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/profile')} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent">
          Edit Profile
        </h1>
      </div>

      <Card className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-tangerine-100 to-orchid-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-tangerine-600">
                    {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-tangerine-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-tangerine-600 transition-colors">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-gray-500 text-sm">Click to change avatar</p>
          </div>

          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              
              <Input
                label="Last Name *"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (123) 456-7890"
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                multiline
                rows={3}
              />
            </div>
          </div>

          {/* Address */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Address</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Street"
                name="address.street"
                value={formData.address?.street || ''}
                onChange={handleChange}
                placeholder="123 Main St"
              />
              
              <Input
                label="City"
                name="address.city"
                value={formData.address?.city || ''}
                onChange={handleChange}
                placeholder="New York"
              />
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="State"
                name="address.state"
                value={formData.address?.state || ''}
                onChange={handleChange}
                placeholder="NY"
              />
              
              <Input
                label="Postal Code"
                name="address.postalCode"
                value={formData.address?.postalCode || ''}
                onChange={handleChange}
                placeholder="10001"
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Country"
                name="address.country"
                value={formData.address?.country || ''}
                onChange={handleChange}
                placeholder="United States"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Skills</h2>
            
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={handleSkillChange}
                onKeyDown={handleAddSkill}
                placeholder="Add a skill and press Enter..."
                className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
              />
            </div>
            
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
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
          </div>

          {/* Social Links */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Social Links</h2>
            
            <div className="space-y-4">
              <Input
                label="Website"
                name="socialLinks.website"
                value={formData.socialLinks?.website || ''}
                onChange={handleChange}
                placeholder="https://example.com"
              />
              
              <Input
                label="LinkedIn"
                name="socialLinks.linkedin"
                value={formData.socialLinks?.linkedin || ''}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
              />
              
              <Input
                label="Twitter"
                name="socialLinks.twitter"
                value={formData.socialLinks?.twitter || ''}
                onChange={handleChange}
                placeholder="https://twitter.com/username"
              />
              
              <Input
                label="Facebook"
                name="socialLinks.facebook"
                value={formData.socialLinks?.facebook || ''}
                onChange={handleChange}
                placeholder="https://facebook.com/username"
              />
              
              <Input
                label="Instagram"
                name="socialLinks.instagram"
                value={formData.socialLinks?.instagram || ''}
                onChange={handleChange}
                placeholder="https://instagram.com/username"
              />
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
            <Button type="button" variant="outline" onClick={() => navigate('/profile')}>
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

export default ProfileEditPage;
