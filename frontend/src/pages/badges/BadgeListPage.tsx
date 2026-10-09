import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Search, Filter, Plus, Eye, Edit, Trash2, Tag, Star, Trophy } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import Badge, { BadgeCategory, BadgeRarity  } from '../../types/badge';

interface BadgeListPageProps {
  role: 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER';
}

const BadgeListPage: React.FC<BadgeListPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [badges, setBadges] = useState<Badge[]>([]);
  const [filteredBadges, setFilteredBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [rarityFilter, setRarityFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchBadges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '/badges';
      
      if (role === 'VOLUNTEER' && user?._id) {
        url = `/badges?volunteer=${user._id}`;
      }
      
      const response = await apiService.get<{ success: boolean; data: Badge[]; message?: string }>(url);
      
      if (response.success) {
        setBadges(response.data || []);
        setFilteredBadges(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch badges');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch badges');
    } finally {
      setIsLoading(false);
    }
  }, [role, user?._id]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  useEffect(() => {
    // Apply filters
    let filtered = [...badges];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(badge => 
        badge.name.toLowerCase().includes(query) ||
        badge.description?.toLowerCase().includes(query) ||
        badge.badgeId?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(badge => badge.category === categoryFilter as BadgeCategory);
    }
    
    // Rarity filter
    if (rarityFilter) {
      filtered = filtered.filter(badge => badge.rarity === rarityFilter as BadgeRarity);
    }
    
    setFilteredBadges(filtered);
  }, [badges, searchQuery, categoryFilter, rarityFilter]);

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

  const handleView = (badge: Badge) => {
    navigate(`/badges/${badge._id}`);
  };

  const handleEdit = (badge: Badge) => {
    navigate(`/badges/${badge._id}/edit`);
  };

  const handleDelete = async (badge: Badge) => {
    if (window.confirm(`Are you sure you want to delete "${badge.name}"?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/badges/${badge._id}`
        );
        
        if (response.success) {
          fetchBadges();
        } else {
          setError(response.message || 'Failed to delete badge');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete badge');
      }
    }
  };

  const handleCreate = () => {
    navigate('/badges/create');
  };

  const categories: BadgeCategory[] = ['PARTICIPATION', 'PERFORMANCE', 'SKILLS', 'TIME', 'ACHIEVEMENT', 'SPECIAL'];
  const rarities: BadgeRarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

  const renderBadgeIcon = (badge: Badge) => {
    const iconSize = 40;
    const bgColor = badge.backgroundColor || '#F5F5F5';
    const iconColor = badge.iconColor || '#666666';
    
    return (
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <span className="text-2xl" style={{ color: iconColor }}>
          {badge.icon}
        </span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent mb-2">
            Badges
          </h1>
          <p className="text-gray-500">
            {role === 'ADMIN' ? 'Manage all badges' : 
             role === 'ORGANIZER' ? 'Available badges for your events' : 
             'Badges you have earned'}
          </p>
        </div>
        
        {role === 'ADMIN' && (
          <Button onClick={handleCreate} className="self-start lg:self-center">
            <Plus className="w-5 h-5" />
            Create Badge
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
              placeholder="Search badges..."
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{getCategoryText(category)}</option>
              ))}
            </select>
            
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
            >
              <option value="">All Rarities</option>
              {rarities.map(rarity => (
                <option key={rarity} value={rarity}>{getRarityText(rarity)}</option>
              ))}
            </select>
            
            <Button
              variant="outline"
              onClick={() => {
                setCategoryFilter('');
                setRarityFilter('');
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        /* Badges Grid */
        <>
          {filteredBadges.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Badges Found</h3>
              <p className="text-gray-500">
                {role === 'VOLUNTEER' 
                  ? 'You have not earned any badges yet.'
                  : 'No badges have been created yet.'}
              </p>
              
              {role === 'ADMIN' && (
                <Button onClick={handleCreate} className="mt-6">
                  <Plus className="w-5 h-5" />
                  Create Your First Badge
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredBadges.map((badge, index) => (
                <motion.div
                  key={badge._id as string || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="p-4 text-center">
                    <div className="mb-4">
                      {renderBadgeIcon(badge)}
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 mb-2">{badge.name}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{badge.description}</p>
                    
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(badge.category)}`}>
                        {getCategoryText(badge.category)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(badge.rarity)}`}>
                        {getRarityText(badge.rarity)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{badge.points} Points</span>
                    </div>
                    
                    <div className="mt-4 flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(badge)}
                        className="p-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      
                      {role === 'ADMIN' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(badge)}
                            className="p-1.5"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(badge)}
                            className="p-1.5 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
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

export default BadgeListPage;
