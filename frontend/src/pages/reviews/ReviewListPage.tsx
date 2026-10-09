import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Search, Filter, Plus, Eye, Edit, Trash2, Calendar, User as UserIcon, FileText } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Review, ReviewType, ReviewStatus } from '../../types/review';

interface ReviewListPageProps {
  role: 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER';
}

const ReviewListPage: React.FC<ReviewListPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '/reviews';
      
      if (role === 'ORGANIZER' && user?._id) {
        url = `/reviews?reviewer=${user._id}`;
      } else if (role === 'VOLUNTEER' && user?._id) {
        url = `/reviews?reviewee=${user._id}`;
      }
      
      const response = await apiService.get<{ success: boolean; data: Review[]; message?: string }>(url);
      
      if (response.success) {
        setReviews(response.data || []);
        setFilteredReviews(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch reviews');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reviews');
    } finally {
      setIsLoading(false);
    }
  }, [role, user?._id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    // Apply filters
    let filtered = [...reviews];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(review => 
        (review.comments?.toLowerCase().includes(query)) ||
        (review.reviewId?.toLowerCase().includes(query))
      );
    }
    
    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(review => review.type === typeFilter as ReviewType);
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(review => review.status === statusFilter as ReviewStatus);
    }
    
    // Rating filter
    if (ratingFilter) {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(review => review.rating === rating);
    }
    
    setFilteredReviews(filtered);
  }, [reviews, searchQuery, typeFilter, statusFilter, ratingFilter]);

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'bg-green-100 text-green-600';
    if (rating >= 3) return 'bg-tangerine-100 text-tangerine-600';
    if (rating >= 2) return 'bg-orchid-100 text-orchid-600';
    return 'bg-red-100 text-red-600';
  };

  const getTypeText = (type: ReviewType) => {
    switch (type) {
      case 'VOLUNTEER':
        return 'Volunteer Review';
      case 'ORGANIZER':
        return 'Organizer Review';
      case 'EVENT':
        return 'Event Review';
      case 'PEER':
        return 'Peer Review';
      default:
        return type;
    }
  };

  const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-600';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-600';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-600';
      case 'ARCHIVED':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: ReviewStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'SUBMITTED':
        return 'Submitted';
      case 'PUBLISHED':
        return 'Published';
      case 'ARCHIVED':
        return 'Archived';
      default:
        return status;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONGLY_RECOMMEND':
        return 'bg-green-100 text-green-600';
      case 'RECOMMEND':
        return 'bg-tangerine-100 text-tangerine-600';
      case 'NEUTRAL':
        return 'bg-gray-100 text-gray-600';
      case 'DO_NOT_RECOMMEND':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONGLY_RECOMMEND':
        return 'Strongly Recommend';
      case 'RECOMMEND':
        return 'Recommend';
      case 'NEUTRAL':
        return 'Neutral';
      case 'DO_NOT_RECOMMEND':
        return 'Do Not Recommend';
      default:
        return recommendation;
    }
  };

  const handleView = (review: Review) => {
    navigate(`/reviews/${review._id}`);
  };

  const handleEdit = (review: Review) => {
    navigate(`/reviews/${review._id}/edit`);
  };

  const handleDelete = async (review: Review) => {
    if (window.confirm(`Are you sure you want to delete this review?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/reviews/${review._id}`
        );
        
        if (response.success) {
          fetchReviews();
        } else {
          setError(response.message || 'Failed to delete review');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete review');
      }
    }
  };

  const handleCreate = () => {
    navigate('/reviews/create');
  };

  const types: ReviewType[] = ['VOLUNTEER', 'ORGANIZER', 'EVENT', 'PEER'];
  const statuses: ReviewStatus[] = ['DRAFT', 'SUBMITTED', 'PUBLISHED', 'ARCHIVED'];
  const ratings = [1, 2, 3, 4, 5];

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
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
            Reviews
          </h1>
          <p className="text-gray-500">
            {role === 'ADMIN' ? 'Manage all reviews' : 
             role === 'ORGANIZER' ? 'Reviews you have submitted' : 
             'Reviews about you'}
          </p>
        </div>
        
        {(role === 'ADMIN' || role === 'ORGANIZER') && (
          <Button onClick={handleCreate} className="self-start lg:self-center">
            <Plus className="w-5 h-5" />
            Create Review
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
              placeholder="Search reviews..."
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
            >
              <option value="">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{getTypeText(type)}</option>
              ))}
            </select>
            
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
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
            >
              <option value="">All Ratings</option>
              {ratings.map(rating => (
                <option key={rating} value={rating}>{rating} Stars</option>
              ))}
            </select>
            
            <Button
              variant="outline"
              onClick={() => {
                setTypeFilter('');
                setStatusFilter('');
                setRatingFilter('');
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
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        /* Reviews List */
        <>
          {filteredReviews.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Reviews Found</h3>
              <p className="text-gray-500">
                {role === 'VOLUNTEER' 
                  ? 'No reviews have been submitted for you yet.'
                  : 'You have not submitted any reviews yet.'}
              </p>
              
              {(role === 'ADMIN' || role === 'ORGANIZER') && (
                <Button onClick={handleCreate} className="mt-6">
                  <Plus className="w-5 h-5" />
                  Create Your First Review
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredReviews.map((review, index) => (
                <motion.div
                  key={review._id as string || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {getTypeText(review.type)}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                            {getStatusText(review.status)}
                          </span>
                        </div>
                        
                        <p className="text-gray-500 mb-3 line-clamp-2">{review.comments}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span>Reviewer: {(review.reviewer as any)?.name || (review.reviewer as any)?.firstName || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span>Reviewee: {(review.reviewee as any)?.name || (review.reviewee as any)?.firstName || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(review.rating)}`}>
                              {review.rating} / 5
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(review.recommendation)}`}>
                              {getRecommendationText(review.recommendation)}
                            </span>
                          </div>
                        </div>
                        
                        {review.strengths && review.strengths.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-500 mb-1">Strengths:</p>
                            <div className="flex flex-wrap gap-1">
                              {review.strengths.map((strength, i) => (
                                <span key={i} className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                                  {strength}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {review.improvements && review.improvements.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500 mb-1">Improvements:</p>
                            <div className="flex flex-wrap gap-1">
                              {review.improvements.map((improvement, i) => (
                                <span key={i} className="px-2 py-1 bg-tangerine-100 text-tangerine-600 rounded-full text-xs">
                                  {improvement}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {(role === 'ADMIN' || role === 'ORGANIZER') && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(review)}
                              className="p-1.5"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(review)}
                              className="p-1.5 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(review)}
                          className="p-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </div>
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

export default ReviewListPage;
