import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Star, Tag, Users, Calendar, Edit, Trash2, CheckCircle, Target } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import Badge, { BadgeCategory, BadgeRarity, VolunteerBadge  } from '../../types/badge';

const BadgeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [badge, setBadge] = useState<Badge | null>(null);
  const [volunteerBadges, setVolunteerBadges] = useState<VolunteerBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadge = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch badge
        const badgeResponse = await apiService.get<{ success: boolean; data: Badge; message?: string }>(
          `/badges/${id}`
        );
        
        if (badgeResponse.success) {
          setBadge(badgeResponse.data);
        } else {
          setError(badgeResponse.message || 'Failed to fetch badge');
        }
        
        // Fetch volunteer badges for this badge
        const vbResponse = await apiService.get<{ success: boolean; data: VolunteerBadge[]; message?: string }>(
          `/badges/${id}/volunteers`
        );
        
        if (vbResponse.success) {
          setVolunteerBadges(vbResponse.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch badge');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchBadge();
    }
  }, [id]);

  const getRarityColor = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'COMMON':
        return 'bg-gray-100 text-gray-600';
      case 'UNCOMMON':
        return 'bg-blue-100 text-blue-600';
      case 'RARE':
        return 'bg-tangerine-100 text-tangerine-600';
      case 'EPIC':
        return 'bg-orchid-100 text-orchid-600';
      case 'LEGENDARY':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getRarityText = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'COMMON':
        return 'Common';
      case 'UNCOMMON':
        return 'Uncommon';
      case 'RARE':
        return 'Rare';
      case 'EPIC':
        return 'Epic';
      case 'LEGENDARY':
        return 'Legendary';
      default:
        return rarity;
    }
  };

  const getCategoryColor = (category: BadgeCategory) => {
    switch (category) {
      case 'PARTICIPATION':
        return 'bg-green-100 text-green-600';
      case 'PERFORMANCE':
        return 'bg-tangerine-100 text-tangerine-600';
      case 'SKILLS':
        return 'bg-blue-100 text-blue-600';
      case 'TIME':
        return 'bg-orchid-100 text-orchid-600';
      case 'ACHIEVEMENT':
        return 'bg-yellow-100 text-yellow-600';
      case 'SPECIAL':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getCategoryText = (category: BadgeCategory) => {
    switch (category) {
      case 'PARTICIPATION':
        return 'Participation';
      case 'PERFORMANCE':
        return 'Performance';
      case 'SKILLS':
        return 'Skills';
      case 'TIME':
        return 'Time';
      case 'ACHIEVEMENT':
        return 'Achievement';
      case 'SPECIAL':
        return 'Special';
      default:
        return category;
    }
  };

  const getCriteriaText = (criteria: any) => {
    if (!criteria) return 'N/A';
    
    switch (criteria.type) {
      case 'EVENT_COUNT':
        return `Complete ${criteria.target} events`;
      case 'VOLUNTEER_HOURS':
        return `Volunteer for ${criteria.target} hours`;
      case 'TASKS_COMPLETED':
        return `Complete ${criteria.target} tasks`;
      case 'PERFORMANCE_SCORE':
        return `Achieve score of ${criteria.target}`;
      case 'SKILLS_MASTERED':
        return `Master ${criteria.target} skills`;
      case 'SPECIAL_ACHIEVEMENT':
        return `Special achievement`;
      case 'TEAMWORK':
        return `Demonstrate teamwork`;
      case 'PUNCTUALITY':
        return `Maintain punctuality`;
      default:
        return criteria.type;
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${badge?.name}"?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/badges/${id}`
        );
        
        if (response.success) {
          navigate('/badges');
        } else {
          setError(response.message || 'Failed to delete badge');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete badge');
      }
    }
  };

  const renderBadgeIcon = (badge: Badge, size = 80) => {
    const bgColor = badge.backgroundColor || '#F5F5F5';
    const borderColor = badge.borderColor || '#DDDDDD';
    const iconColor = badge.iconColor || '#666666';
    
    return (
      <div
        className={`w-${size} h-${size} rounded-xl flex items-center justify-center border-4`}
        style={{ 
          backgroundColor: bgColor,
          borderColor: borderColor
        }}
      >
        <span className="text-4xl" style={{ color: iconColor }}>
          {badge.icon}
        </span>
      </div>
    );
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

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </motion.div>
    );
  }

  if (!badge) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Badge Not Found</h3>
          <Button onClick={() => navigate('/badges')} variant="ghost" className="mt-4">
            Back to Badges
          </Button>
        </Card>
      </motion.div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/badges')} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent">
          {badge.name}
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        {isAdmin && (
          <>
            <Button onClick={() => navigate(`/badges/${badge._id}/edit`)}>
              <Edit className="w-5 h-5 mr-2" />
              Edit Badge
            </Button>
            <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-5 h-5 mr-2" />
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Badge Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex flex-col items-center text-center mb-6">
            {renderBadgeIcon(badge)}
            
            <div className="mt-4 flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(badge.category)}`}>
                {getCategoryText(badge.category)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRarityColor(badge.rarity)}`}>
                {getRarityText(badge.rarity)}
              </span>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-800 mt-4">{badge.name}</h2>
            <p className="text-gray-500 mt-2">{badge.shortDescription || badge.description}</p>
            
            <div className="mt-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-800 font-medium">{badge.points} Points</span>
            </div>
          </div>
          
          {/* Description */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600">{badge.description}</p>
          </div>
          
          {/* Criteria */}
          <div className="mb-6 p-4 bg-lilac-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Criteria</h3>
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-orchid-500" />
              <span className="text-gray-800">{getCriteriaText(badge.criteria)}</span>
            </div>
          </div>
          
          {/* Volunteers who earned this badge */}
          {volunteerBadges.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Volunteers who earned this badge ({volunteerBadges.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {volunteerBadges.slice(0, 12).map((vb, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-tangerine-100 rounded-full flex items-center justify-center">
                      <span className="text-tangerine-600 font-medium">
                        {(vb.volunteer as any)?.firstName?.charAt(0) || 'V'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 font-medium">
                      {(vb.volunteer as any)?.name || (vb.volunteer as any)?.firstName || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Earned: {new Date(vb.earnedAt).toLocaleDateString()}
                    </p>
                    {vb.level && (
                      <span className="px-2 py-1 bg-orchid-100 text-orchid-600 rounded-full text-xs">
                        Level {vb.level}
                      </span>
                    )}
                  </div>
                ))}
                {volunteerBadges.length > 12 && (
                  <p className="text-sm text-gray-500 mt-3">+{volunteerBadges.length - 12} more volunteers</p>
                )}
              </div>
            </div>
          )}
        </Card>
        
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Badge Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Badge ID:</span>
                <span className="font-medium text-gray-800">{badge.badgeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${getCategoryColor(badge.category)}`}>
                  {getCategoryText(badge.category)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rarity:</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${getRarityColor(badge.rarity)}`}>
                  {getRarityText(badge.rarity)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Points:</span>
                <span className="font-medium text-gray-800">{badge.points}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Active:</span>
                <span className="font-medium text-gray-800">{badge.isActive ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Order:</span>
                <span className="font-medium text-gray-800">{badge.order}</span>
              </div>
            </div>
          </Card>
          
          {/* Color Scheme */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Color Scheme</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: badge.iconColor }} />
                <span className="text-gray-800">Icon Color</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded" style={{ backgroundColor: badge.backgroundColor }} />
                <span className="text-gray-800">Background</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded border-2" style={{ borderColor: badge.borderColor }} />
                <span className="text-gray-800">Border</span>
              </div>
            </div>
          </Card>
          
          {/* Dates */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Dates</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="font-medium text-gray-800">{new Date(badge.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated:</span>
                <span className="font-medium text-gray-800">{new Date(badge.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
          
          {/* Actions */}
          {isAdmin && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Actions</h3>
              <div className="space-y-3">
                <Button onClick={() => navigate(`/badges/${badge._id}/edit`)} className="w-full">
                  <Edit className="w-5 h-5 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={handleDelete} className="w-full text-red-500 hover:text-red-600">
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BadgeDetailPage;
