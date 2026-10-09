import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Calendar, Clock, Award, Mail, Phone, MapPin, Edit, Shield, Crown } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
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
  joinDate?: string;
  skills?: string[];
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  stats?: {
    totalEvents: number;
    totalHours: number;
    totalTasks: number;
    averageRating: number;
    badgesEarned: number;
  };
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiService.get<{ success: boolean; data: UserProfile; message?: string }>(
          `/users/${user?._id}`
        );
        
        if (response.success) {
          setProfile(response.data);
        } else {
          setError(response.message || 'Failed to fetch profile');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?._id) {
      fetchProfile();
    }
  }, [user?._id]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-5 h-5 text-red-500" />;
      case 'ORGANIZER':
        return <Crown className="w-5 h-5 text-orchid-500" />;
      case 'VOLUNTEER':
        return <Award className="w-5 h-5 text-tangerine-500" />;
      default:
        return <UserIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'ORGANIZER':
        return 'Event Organizer';
      case 'VOLUNTEER':
        return 'Volunteer';
      default:
        return role;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg max-w-4xl mx-auto">
          {error}
        </div>
      </motion.div>
    );
  }

  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="text-center py-12 max-w-4xl mx-auto">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Profile Not Found</h3>
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
          My Profile
        </h1>
        <p className="text-gray-500">View and manage your profile information</p>
      </div>

      {/* Profile Card */}
      <Card className="p-6 max-w-4xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-gradient-to-br from-tangerine-100 to-orchid-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-tangerine-600">
                  {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                </span>
              )}
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-gray-800">
                {profile.firstName} {profile.lastName}
              </h2>
              <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                {getRoleIcon(profile.role)}
                {getRoleText(profile.role)}
              </span>
            </div>
            
            <p className="text-gray-500 mb-4">{profile.bio || 'No bio yet'}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-tangerine-500" />
                <span>{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-tangerine-500" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.dateOfBirth && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-tangerine-500" />
                  <span>{new Date(profile.dateOfBirth).toLocaleDateString()}</span>
                </div>
              )}
              {profile.joinDate && (
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-tangerine-500" />
                  <span>Joined: {new Date(profile.joinDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/profile/edit')}>
              <Edit className="w-5 h-5 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" onClick={handleLogout} className="text-red-500 hover:text-red-600">
              Logout
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      {profile.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto mb-6">
          <Card className="p-4 text-center">
            <Calendar className="w-8 h-8 text-tangerine-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{profile.stats.totalEvents}</p>
            <p className="text-gray-500 text-sm">Events</p>
          </Card>
          
          <Card className="p-4 text-center">
            <Clock className="w-8 h-8 text-orchid-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{profile.stats.totalHours}</p>
            <p className="text-gray-500 text-sm">Hours</p>
          </Card>
          
          <Card className="p-4 text-center">
            <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{profile.stats.averageRating.toFixed(1)}</p>
            <p className="text-gray-500 text-sm">Rating</p>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="w-8 h-8 bg-tangerine-100 rounded mx-auto mb-2 flex items-center justify-center">
              <span className="text-tangerine-600">✓</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{profile.stats.totalTasks}</p>
            <p className="text-gray-500 text-sm">Tasks</p>
          </Card>
          
          <Card className="p-4 text-center">
            <Award className="w-8 h-8 text-orchid-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{profile.stats.badgesEarned}</p>
            <p className="text-gray-500 text-sm">Badges</p>
          </Card>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Personal Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Full Name:</span>
              <span className="font-medium text-gray-800">{profile.firstName} {profile.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium text-gray-800">{profile.email}</span>
            </div>
            {profile.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Phone:</span>
                <span className="font-medium text-gray-800">{profile.phone}</span>
              </div>
            )}
            {profile.dateOfBirth && (
              <div className="flex justify-between">
                <span className="text-gray-500">Date of Birth:</span>
                <span className="font-medium text-gray-800">{new Date(profile.dateOfBirth).toLocaleDateString()}</span>
              </div>
            )}
            {profile.joinDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Join Date:</span>
                <span className="font-medium text-gray-800">{new Date(profile.joinDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </Card>
        
        {/* Address */}
        {profile.address && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Address</h2>
            <div className="space-y-3">
              {profile.address.street && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Street:</span>
                  <span className="font-medium text-gray-800">{profile.address.street}</span>
                </div>
              )}
              {profile.address.city && (
                <div className="flex justify-between">
                  <span className="text-gray-500">City:</span>
                  <span className="font-medium text-gray-800">{profile.address.city}</span>
                </div>
              )}
              {profile.address.state && (
                <div className="flex justify-between">
                  <span className="text-gray-500">State:</span>
                  <span className="font-medium text-gray-800">{profile.address.state}</span>
                </div>
              )}
              {profile.address.postalCode && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Postal Code:</span>
                  <span className="font-medium text-gray-800">{profile.address.postalCode}</span>
                </div>
              )}
              {profile.address.country && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Country:</span>
                  <span className="font-medium text-gray-800">{profile.address.country}</span>
                </div>
              )}
            </div>
          </Card>
        )}
        
        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <Card className="p-6 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-tangerine-100 text-tangerine-600 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        )}
        
        {/* Social Links */}
        {profile.socialLinks && (
          <Card className="p-6 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Social Links</h2>
            <div className="flex flex-wrap gap-4">
              {profile.socialLinks.website && (
                <a
                  href={profile.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-tangerine-500 hover:text-tangerine-600"
                >
                  <span className="w-4 h-4 bg-tangerine-100 rounded flex items-center justify-center">
                    <span className="text-tangerine-600 text-xs">🌐</span>
                  </span>
                  Website
                </a>
              )}
              {profile.socialLinks.linkedin && (
                <a
                  href={profile.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-orchid-500 hover:text-orchid-600"
                >
                  <span className="w-4 h-4 bg-orchid-100 rounded flex items-center justify-center">
                    <span className="text-orchid-600 text-xs">in</span>
                  </span>
                  LinkedIn
                </a>
              )}
              {profile.socialLinks.twitter && (
                <a
                  href={profile.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                >
                  <span className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 text-xs">🐦</span>
                  </span>
                  Twitter
                </a>
              )}
              {profile.socialLinks.facebook && (
                <a
                  href={profile.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-indigo-500 hover:text-indigo-600"
                >
                  <span className="w-4 h-4 bg-indigo-100 rounded flex items-center justify-center">
                    <span className="text-indigo-600 text-xs">f</span>
                  </span>
                  Facebook
                </a>
              )}
              {profile.socialLinks.instagram && (
                <a
                  href={profile.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-pink-500 hover:text-pink-600"
                >
                  <span className="w-4 h-4 bg-pink-100 rounded flex items-center justify-center">
                    <span className="text-pink-600 text-xs">📷</span>
                  </span>
                  Instagram
                </a>
              )}
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
};

export default ProfilePage;
