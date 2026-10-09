import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Eye, ThumbsUp, MessageSquare, Pin, Edit, Trash2, Tag } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Announcement, AnnouncementPriority, AnnouncementStatus } from '../../types/announcement';

const AnnouncementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiService.get<{ success: boolean; data: Announcement; message?: string }>(
          `/announcements/${id}`
        );
        
        if (response.success) {
          setAnnouncement(response.data);
        } else {
          setError(response.message || 'Failed to fetch announcement');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch announcement');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchAnnouncement();
    }
  }, [id]);

  const getPriorityColor = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'LOW':
        return 'bg-blue-100 text-blue-600';
      case 'MEDIUM':
        return 'bg-tangerine-100 text-tangerine-600';
      case 'HIGH':
        return 'bg-orchid-100 text-orchid-600';
      case 'URGENT':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityText = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'LOW':
        return 'Low';
      case 'MEDIUM':
        return 'Medium';
      case 'HIGH':
        return 'High';
      case 'URGENT':
        return 'Urgent';
      default:
        return priority;
    }
  };

  const getStatusColor = (status: AnnouncementStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-600';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-600';
      case 'ARCHIVED':
        return 'bg-yellow-100 text-yellow-600';
      case 'DELETED':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: AnnouncementStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'PUBLISHED':
        return 'Published';
      case 'ARCHIVED':
        return 'Archived';
      case 'DELETED':
        return 'Deleted';
      default:
        return status;
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${announcement?.title}"?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/announcements/${id}`
        );
        
        if (response.success) {
          navigate('/announcements');
        } else {
          setError(response.message || 'Failed to delete announcement');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete announcement');
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

  if (!announcement) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <Card className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Announcement Not Found</h3>
          <Button onClick={() => navigate('/announcements')} variant="ghost" className="mt-4">
            Back to Announcements
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
        <Button variant="ghost" onClick={() => navigate('/announcements')} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent">
          {announcement.title}
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        {isAdminOrOrganizer && (
          <>
            <Button onClick={() => navigate(`/announcements/${announcement._id}/edit`)}>
              <Edit className="w-5 h-5 mr-2" />
              Edit Announcement
            </Button>
            <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-5 h-5 mr-2" />
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Announcement Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(announcement.priority)}`}>
                {getPriorityText(announcement.priority)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(announcement.status)}`}>
                {getStatusText(announcement.status)}
              </span>
              {announcement.isPinned && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-orchid-100 text-orchid-600 flex items-center gap-2">
                  <Pin className="w-4 h-4" />
                  Pinned
                </span>
              )}
            </div>
          </div>
          
          {/* Message */}
          <div className="mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{announcement.message}</p>
          </div>
          
          {/* Content (Rich Text) */}
          {announcement.content && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Content</h3>
              <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
            </div>
          )}
          
          {/* Attachments */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Attachments ({announcement.attachments.length})</h3>
              <div className="space-y-2">
                {announcement.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-tangerine-100 rounded flex items-center justify-center">
                      <span className="text-tangerine-600 text-xs font-medium">PDF</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{attachment.fileName}</p>
                      <p className="text-gray-500 text-xs">{(attachment.fileSize / 1024).toFixed(2)} KB</p>
                    </div>
                    <Button variant="ghost" size="sm" className="p-1.5">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Tags */}
          {announcement.tags && announcement.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-6">
              <Tag className="w-5 h-5 text-gray-500" />
              <div className="flex flex-wrap gap-2">
                {announcement.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Engagement Stats */}
          <div className="flex items-center gap-6 p-4 bg-lilac-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-orchid-500" />
              <span className="text-gray-800">{announcement.readCount} Views</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-orchid-500" />
              <span className="text-gray-800">{announcement.likeCount} Likes</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orchid-500" />
              <span className="text-gray-800">{announcement.commentCount} Comments</span>
            </div>
          </div>
        </Card>
        
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Announcement Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Announcement ID:</span>
                <span className="font-medium text-gray-800">{announcement.announcementId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Priority:</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${getPriorityColor(announcement.priority)}`}>
                  {getPriorityText(announcement.priority)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${getStatusColor(announcement.status)}`}>
                  {getStatusText(announcement.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created By:</span>
                <span className="font-medium text-gray-800">
                  {(announcement.createdBy as any)?.name || (announcement.createdBy as any)?.firstName || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Published:</span>
                <span className="font-medium text-gray-800">
                  {announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleDateString() : 'Not published'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Scheduled:</span>
                <span className="font-medium text-gray-800">
                  {announcement.scheduledAt ? new Date(announcement.scheduledAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expires:</span>
                <span className="font-medium text-gray-800">
                  {announcement.expiresAt ? new Date(announcement.expiresAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </Card>
          
          {/* Event Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Event</h3>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-tangerine-500" />
              <span className="font-medium text-gray-800">
                {(announcement.event as any)?.title || (announcement.event as any)?._id || 'N/A'}
              </span>
            </div>
          </Card>
          
          {/* Actions */}
          {isAdminOrOrganizer && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Actions</h3>
              <div className="space-y-3">
                <Button onClick={() => navigate(`/announcements/${announcement._id}/edit`)} className="w-full">
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

export default AnnouncementDetailPage;
