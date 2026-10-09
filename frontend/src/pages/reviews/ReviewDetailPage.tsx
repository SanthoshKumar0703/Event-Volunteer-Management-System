import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, User, Calendar, FileText, Edit, Trash2, CheckCircle, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Review, ReviewType, ReviewStatus, ReviewDimension } from '../../types/review';

const ReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiService.get<{ success: boolean; data: Review; message?: string }>(
          `/reviews/${id}`
        );
        
        if (response.success) {
          setReview(response.data);
        } else {
          setError(response.message || 'Failed to fetch review');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch review');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchReview();
    }
  }, [id]);

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

  const getDimensionLabel = (dimension: ReviewDimension) => {
    switch (dimension) {
      case 'COMMUNICATION':
        return 'Communication';
      case 'TEAMWORK':
        return 'Teamwork';
      case 'PUNCTUALITY':
        return 'Punctuality';
      case 'TASK_COMPLETION':
        return 'Task Completion';
      case 'RESPONSIBILITY':
        return 'Responsibility';
      case 'LEADERSHIP':
        return 'Leadership';
      case 'ADAPTABILITY':
        return 'Adaptability';
      default:
        return dimension;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'bg-green-100 text-green-600';
    if (rating >= 3) return 'bg-tangerine-100 text-tangerine-600';
    if (rating >= 2) return 'bg-orchid-100 text-orchid-600';
    return 'bg-red-100 text-red-600';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this review?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/reviews/${id}`
        );
        
        if (response.success) {
          navigate('/reviews');
        } else {
          setError(response.message || 'Failed to delete review');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete review');
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

  if (!review) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Review Not Found</h3>
          <Button onClick={() => navigate('/reviews')} variant="ghost" className="mt-4">
            Back to Reviews
          </Button>
        </Card>
      </motion.div>
    );
  }

  const isAdminOrOrganizer = user?.role === 'ADMIN' || user?.role === 'ORGANIZER';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/reviews')} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent">
          Review Details
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        {isAdminOrOrganizer && (
          <>
            <Button onClick={() => navigate(`/reviews/${review._id}/edit`)}>
              <Edit className="w-5 h-5 mr-2" />
              Edit Review
            </Button>
            <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-5 h-5 mr-2" />
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Review Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(review.status)}`}>
              {getStatusText(review.status)}
            </span>
          </div>
          
          {/* Type and Rating */}
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">{getTypeText(review.type)}</h2>
            <div className="flex items-center gap-2">
              {renderStars(review.rating)}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(review.overallScore)}`}>
                {review.overallScore} / 5
              </span>
            </div>
          </div>
          
          {/* Comments */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Comments</h3>
            <p className="text-gray-700">{review.comments}</p>
          </div>
          
          {/* Recommendation */}
          <div className="mb-6 p-4 bg-lilac-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Recommendation</h3>
            <span className={`px-4 py-2 rounded-full font-medium ${getRecommendationColor(review.recommendation)}`}>
              {getRecommendationText(review.recommendation)}
            </span>
          </div>
          
          {/* Dimensions */}
          {review.dimensions && review.dimensions.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Dimension Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {review.dimensions.map((dimension, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{getDimensionLabel(dimension.dimension)}</span>
                      <div className="flex items-center gap-2">
                        {renderStars(dimension.score)}
                        <span className="text-gray-600">{dimension.score} / 5</span>
                      </div>
                    </div>
                    {dimension.comment && (
                      <p className="text-gray-500 text-sm mt-2">{dimension.comment}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Strengths */}
          {review.strengths && review.strengths.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Strengths</h3>
              <div className="flex flex-wrap gap-2">
                {review.strengths.map((strength, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Improvements */}
          {review.improvements && review.improvements.length > 0 && (
            <div className="mb-6 p-4 bg-tangerine-50 rounded-lg">
              <h3 className="font-semibold text-tangerine-800 mb-2">Areas for Improvement</h3>
              <div className="flex flex-wrap gap-2">
                {review.improvements.map((improvement, index) => (
                  <span key={index} className="px-3 py-1 bg-tangerine-100 text-tangerine-600 rounded-full text-sm">
                    {improvement}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
        
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Review Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Review ID:</span>
                <span className="font-medium text-gray-800">{review.reviewId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="font-medium text-gray-800">{getTypeText(review.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${getStatusColor(review.status)}`}>
                  {getStatusText(review.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rating:</span>
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Overall Score:</span>
                <span className="font-medium text-gray-800">{review.overallScore} / 5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Anonymous:</span>
                <span className="font-medium text-gray-800">{review.isAnonymous ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Public:</span>
                <span className="font-medium text-gray-800">{review.isPublic ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </Card>
          
          {/* Reviewer Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Reviewer</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-tangerine-100 rounded-full flex items-center justify-center">
                <span className="text-tangerine-600 font-medium">
                  {(review.reviewer as any)?.firstName?.charAt(0) || 'R'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  {(review.reviewer as any)?.name || (review.reviewer as any)?.firstName || 'N/A'}
                </p>
                <p className="text-gray-500 text-sm">
                  {(review.reviewer as any)?.email || 'N/A'}
                </p>
              </div>
            </div>
          </Card>
          
          {/* Reviewee Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Reviewee</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orchid-100 rounded-full flex items-center justify-center">
                <span className="text-orchid-600 font-medium">
                  {(review.reviewee as any)?.firstName?.charAt(0) || 'V'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  {(review.reviewee as any)?.name || (review.reviewee as any)?.firstName || 'N/A'}
                </p>
                <p className="text-gray-500 text-sm">
                  {(review.reviewee as any)?.email || 'N/A'}
                </p>
              </div>
            </div>
          </Card>
          
          {/* Event Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Event</h3>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-tangerine-500" />
              <span className="font-medium text-gray-800">
                {(review.event as any)?.title || (review.event as any)?._id || 'N/A'}
              </span>
            </div>
          </Card>
          
          {/* Dates */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Dates</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="font-medium text-gray-800">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated:</span>
                <span className="font-medium text-gray-800">{new Date(review.updatedAt).toLocaleDateString()}</span>
              </div>
              {review.submittedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Submitted:</span>
                  <span className="font-medium text-gray-800">{new Date(review.submittedAt).toLocaleDateString()}</span>
                </div>
              )}
              {review.publishedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Published:</span>
                  <span className="font-medium text-gray-800">{new Date(review.publishedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </Card>
          
          {/* Actions */}
          {isAdminOrOrganizer && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Actions</h3>
              <div className="space-y-3">
                <Button onClick={() => navigate(`/reviews/${review._id}/edit`)} className="w-full">
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

export default ReviewDetailPage;
