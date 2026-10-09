import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Send, ArrowLeft, Calendar, User as UserIcon, Info } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Event } from '../../types/event';

const ApplicationCreatePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    coverLetter: '',
    answers: {} as Record<string, string>
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [questions, setQuestions] = useState<{ id: string; question: string }[]>([]);

  const fetchEvent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (eventId) {
        const response = await apiService.get<{ success: boolean; data: Event; message?: string }>(
          `/events/${eventId}`
        );
        
        if (response.success) {
          setEvent(response.data);
          
          // If event has custom questions, load them
          // For now, use default questions
          setQuestions([
            { id: 'q1', question: 'Why do you want to volunteer for this event?' },
            { id: 'q2', question: 'What relevant skills or experience do you have?' },
            { id: 'q3', question: 'Are you available for the entire event duration?' }
          ]);
        } else {
          setError(response.message || 'Event not found');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch event');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value }
    }));
    if (error) setError(null);
  };

  const validate = () => {
    if (!formData.coverLetter.trim()) {
      setError('Cover letter is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    if (!eventId || !user?._id) return;
    
    setIsSubmitting(true);
    
    try {
      // Convert answers array to the expected format
      const answersArray = questions.map(q => ({
        questionId: q.id,
        question: q.question,
        answer: formData.answers[q.id] || ''
      }));
      
      const response = await apiService.post<{ success: boolean; message: string; data: any }>(
        '/applications',
        {
          eventId,
          volunteerId: user._id,
          coverLetter: formData.coverLetter,
          answers: answersArray
        }
      );
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/volunteer/applications`);
        }, 2000);
      } else {
        setError(response.message || 'Failed to submit application');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
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
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <Card className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error && !event) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="max-w-4xl mx-auto p-6 text-center">
          <Info className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/events')}>
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </Button>
        </Card>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="max-w-4xl mx-auto p-6 text-center">
          <Send className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your application has been successfully submitted. You will be notified of the decision soon.
          </p>
          <Button onClick={() => navigate('/volunteer/applications')}>
            View My Applications
          </Button>
        </Card>
      </motion.div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span className="hover:text-tangerine-500 cursor-pointer" onClick={() => navigate('/events')}>
            Events
          </span>
          <span>/</span>
          <span className="hover:text-tangerine-500 cursor-pointer" onClick={() => navigate(`/events/${eventId}`)}>
            {event.title}
          </span>
          <span>/</span>
          <span className="text-gray-800">Apply</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent mb-2">
              Apply for {event.title}
            </h1>
            <p className="text-gray-500">
              Complete the form below to apply as a volunteer
            </p>
          </div>
          
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
        </div>

        {/* Event Summary */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Summary</h2>
          
          <div className="flex items-center gap-4">
            {event.image && (
              <img
                src={event.image}
                alt={event.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
              <p className="text-gray-500 text-sm">{event.eventId}</p>
              
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  {event.requiredVolunteers} volunteers needed
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Cover Letter */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Cover Letter
            </h2>
            <p className="text-gray-500 mb-4">
              Tell us why you're interested in volunteering for this event and what makes you a good fit.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Cover Letter
              </label>
              <textarea
                name="coverLetter"
                placeholder="Write your cover letter here..."
                value={formData.coverLetter}
                onChange={handleChange}
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none transition-colors resize-none"
                required
              />
            </div>
          </Card>

          {/* Custom Questions */}
          {questions.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Application Questions
              </h2>
              
              <div className="space-y-4">
                {questions.map((q, index) => (
                  <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question {index + 1}: {q.question}
                    </label>
                    <textarea
                      placeholder="Your answer..."
                      value={formData.answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none transition-colors resize-none"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="bg-gradient-to-r from-tangerine-500 to-orchid-500"
            >
              <Send className="w-5 h-5" />
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ApplicationCreatePage;
