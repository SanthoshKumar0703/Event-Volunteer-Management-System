import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, User, Calendar, Save, Plus, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Review, UpdateReview, ReviewType, ReviewStatus, ReviewDimension, ReviewRecommendation } from '../../types/review';

const dimensionLabels: Record<ReviewDimension, string> = {
  COMMUNICATION: 'Communication',
  TEAMWORK: 'Teamwork',
  PUNCTUALITY: 'Punctuality',
  TASK_COMPLETION: 'Task Completion',
  RESPONSIBILITY: 'Responsibility',
  LEADERSHIP: 'Leadership',
  ADAPTABILITY: 'Adaptability',
};

const ReviewEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<UpdateReview & {
    revieweeId: string;
    eventId: string;
    assignmentId: string;
    type: ReviewType;
    dimensions: { dimension: ReviewDimension; score: number; comment: string }[];
    comments: string;
    strengths: string[];
    improvements: string[];
    rating: number;
    recommendation: ReviewRecommendation;
    isAnonymous: boolean;
    isPublic: boolean;
    reviewerId: string;
  }>({
    revieweeId: '',
    eventId: '',
    assignmentId: '',
    type: 'VOLUNTEER',
    dimensions: [],
    comments: '',
    strengths: [],
    improvements: [],
    rating: 3,
    recommendation: 'RECOMMEND',
    isAnonymous: false,
    isPublic: false,
    reviewerId: user?._id || '',
    status: 'DRAFT',
  });
  
  const [strengthInput, setStrengthInput] = useState('');
  const [improvementInput, setImprovementInput] = useState('');
  const [events, setEvents] = useState<{ _id: string; title: string }[]>([]);
  const [volunteers, setVolunteers] = useState<{ _id: string; name: string }[]>([]);
  const [assignments, setAssignments] = useState<{ _id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch review
        const reviewResponse = await apiService.get<{ success: boolean; data: Review; message?: string }>(
          `/reviews/${id}`
        );
        
        if (reviewResponse.success) {
          const review = reviewResponse.data;
          setFormData({
            revieweeId: review.reviewee as string,
            eventId: review.event as string,
            assignmentId: review.assignment as string,
            type: review.type,
            dimensions: review.dimensions || [],
            comments: review.comments || '',
            strengths: review.strengths || [],
            improvements: review.improvements || [],
            rating: review.rating,
            recommendation: review.recommendation,
            isAnonymous: review.isAnonymous,
            isPublic: review.isPublic,
            reviewerId: review.reviewer as string,
            status: review.status,
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
        
        // Fetch volunteers
        const volunteersResponse = await apiService.get<{ success: boolean; data: any[] }>('/users?role=VOLUNTEER');
        if (volunteersResponse.success) {
          setVolunteers(volunteersResponse.data.map(v => ({
            _id: v._id as string,
            name: `${v.firstName} ${v.lastName}`
          })));
        }
        
        // Fetch assignments
        const assignmentsResponse = await apiService.get<{ success: boolean; data: any[] }>('/assignments');
        if (assignmentsResponse.success) {
          setAssignments(assignmentsResponse.data.map(a => ({
            _id: a._id as string,
            name: a.name || a._id
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
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDimensionChange = (dimension: ReviewDimension, field: 'score' | 'comment', value: number | string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: prev.dimensions.map(d =>
        d.dimension === dimension ? { ...d, [field]: value } : d
      )
    }));
  };

  const handleStrengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStrengthInput(e.target.value);
  };

  const handleAddStrength = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && strengthInput.trim() && !formData.strengths.includes(strengthInput.trim())) {
      setFormData(prev => ({
        ...prev,
        strengths: [...prev.strengths, strengthInput.trim()]
      }));
      setStrengthInput('');
    }
  };

  const handleRemoveStrength = (strength: string) => {
    setFormData(prev => ({
      ...prev,
      strengths: prev.strengths.filter(s => s !== strength)
    }));
  };

  const handleImprovementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImprovementInput(e.target.value);
  };

  const handleAddImprovement = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && improvementInput.trim() && !formData.improvements.includes(improvementInput.trim())) {
      setFormData(prev => ({
        ...prev,
        improvements: [...prev.improvements, improvementInput.trim()]
      }));
      setImprovementInput('');
    }
  };

  const handleRemoveImprovement = (improvement: string) => {
    setFormData(prev => ({
      ...prev,
      improvements: prev.improvements.filter(i => i !== improvement)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate required fields
      if (!formData.revieweeId || !formData.eventId || !formData.type) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      const response = await apiService.put<{ success: boolean; data: any; message?: string }>(
        `/reviews/${id}`,
        formData
      );
      
      if (response.success) {
        setSuccess('Review updated successfully!');
        setTimeout(() => {
          navigate(`/reviews/${id}`);
        }, 1500);
      } else {
        setError(response.message || 'Failed to update review');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, editable = false, onChange?: (value: number) => void) => {
    if (editable) {
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange && onChange(star)}
              className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}
            >
              <Star className="w-6 h-6 fill-current" />
            </button>
          ))}
        </div>
      );
    }
    
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
        <Button variant="ghost" onClick={() => navigate(`/reviews/${id}`)} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent">
          Edit Review
        </h1>
      </div>

      <Card className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Review Type *"
                name="type"
                type="select"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="VOLUNTEER">Volunteer Review</option>
                <option value="ORGANIZER">Organizer Review</option>
                <option value="EVENT">Event Review</option>
                <option value="PEER">Peer Review</option>
              </Input>
              
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
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Reviewee *"
                name="revieweeId"
                type="select"
                value={formData.revieweeId}
                onChange={handleChange}
                required
              >
                <option value="">Select Reviewee</option>
                {volunteers.map(volunteer => (
                  <option key={volunteer._id} value={volunteer._id}>{volunteer.name}</option>
                ))}
              </Input>
              
              <Input
                label="Assignment (Optional)"
                name="assignmentId"
                type="select"
                value={formData.assignmentId}
                onChange={handleChange}
              >
                <option value="">Select Assignment</option>
                {assignments.map(assignment => (
                  <option key={assignment._id} value={assignment._id}>{assignment.name}</option>
                ))}
              </Input>
            </div>
            
            <div className="mt-4">
              <Input
                label="Status"
                name="status"
                type="select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </Input>
            </div>
          </div>

          {/* Rating */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Overall Rating</h2>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Rating: {formData.rating}/5</span>
              {renderStars(formData.rating, true, (value) => setFormData(prev => ({ ...prev, rating: value })))}
            </div>
            
            <div className="mt-4">
              <Input
                label="Recommendation"
                name="recommendation"
                type="select"
                value={formData.recommendation}
                onChange={handleChange}
              >
                <option value="STRONGLY_RECOMMEND">Strongly Recommend</option>
                <option value="RECOMMEND">Recommend</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="DO_NOT_RECOMMEND">Do Not Recommend</option>
              </Input>
            </div>
          </div>

          {/* Dimension Scores */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Dimension Scores</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(ReviewDimension).map((dimension) => {
                const dim = formData.dimensions.find(d => d.dimension === dimension);
                const score = dim?.score || 3;
                const comment = dim?.comment || '';
                
                return (
                  <Card key={dimension} className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-800">{dimensionLabels[dimension]}</h3>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">{score}/5</span>
                        {renderStars(score, true, (value) => 
                          handleDimensionChange(dimension, 'score', value)
                        )}
                      </div>
                      <Input
                        label="Comment (Optional)"
                        value={comment}
                        onChange={(e) => handleDimensionChange(dimension, 'comment', e.target.value)}
                        placeholder="Add comment..."
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Comments */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Comments</h2>
            
            <Input
              label="General Comments"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              placeholder="Enter your overall comments..."
              multiline
              rows={4}
            />
          </div>

          {/* Strengths */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Strengths</h2>
            
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-5 h-5 text-green-500" />
              <input
                type="text"
                value={strengthInput}
                onChange={handleStrengthChange}
                onKeyDown={handleAddStrength}
                placeholder="Add a strength and press Enter..."
                className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
              />
            </div>
            
            {formData.strengths.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.strengths.map((strength, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm flex items-center gap-2"
                  >
                    {strength}
                    <button
                      type="button"
                      onClick={() => handleRemoveStrength(strength)}
                      className="text-green-500 hover:text-green-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Improvements */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Areas for Improvement</h2>
            
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-5 h-5 text-tangerine-500" />
              <input
                type="text"
                value={improvementInput}
                onChange={handleImprovementChange}
                onKeyDown={handleAddImprovement}
                placeholder="Add an improvement area and press Enter..."
                className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
              />
            </div>
            
            {formData.improvements.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.improvements.map((improvement, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-tangerine-100 text-tangerine-600 rounded-full text-sm flex items-center gap-2"
                  >
                    {improvement}
                    <button
                      type="button"
                      onClick={() => handleRemoveImprovement(improvement)}
                      className="text-tangerine-500 hover:text-tangerine-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                  className="w-4 h-4 text-tangerine-500 rounded focus:ring-tangerine-500"
                />
                <label htmlFor="isAnonymous" className="text-gray-700 cursor-pointer">
                  This review is anonymous
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="w-4 h-4 text-tangerine-500 rounded focus:ring-tangerine-500"
                />
                <label htmlFor="isPublic" className="text-gray-700 cursor-pointer">
                  This review is public (visible to reviewee)
                </label>
              </div>
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
            <Button type="button" variant="outline" onClick={() => navigate(`/reviews/${id}`)}>
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

export default ReviewEditPage;
