import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone, Search, Filter, Plus, Eye, Edit, Trash2, Calendar, Tag, ThumbsUp, MessageSquare, Pin } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import { Announcement, AnnouncementPriority, AnnouncementStatus } from '../../types/announcement';

interface AnnouncementListPageProps {
  role: 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER';
}

const AnnouncementListPage: React.FC<AnnouncementListPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '/announcements';
      
      if (role === 'ORGANIZER' && user?._id) {
        url = `/announcements?createdBy=${user._id}`;
      } else if (role === 'VOLUNTEER' && user?._id) {
        url = `/announcements?volunteer=${user._id}`;
      }
      
      const response = await apiService.get<{ success: boolean; data: Announcement[]; message?: string }>(url);
      
      if (response.success) {
        setAnnouncements(response.data || []);
        setFilteredAnnouncements(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch announcements');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch announcements');
    } finally {
      setIsLoading(false);
    }
  }, [role, user?._id]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    // Apply filters
    let filtered = [...announcements];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(announcement => 
        announcement.title.toLowerCase().includes(query) ||
        announcement.message.toLowerCase().includes(query) ||
        announcement.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(announcement => announcement.priority === priorityFilter as AnnouncementPriority);
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(announcement => announcement.status === statusFilter as AnnouncementStatus);
    }
    
    setFilteredAnnouncements(filtered);
  }, [announcements, searchQuery, priorityFilter, statusFilter]);

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

  const handleView = (announcement: Announcement) => {
    navigate(`/announcements/${announcement._id}`);
  };

  const handleEdit = (announcement: Announcement) => {
    navigate(`/announcements/${announcement._id}/edit`);
  };

  const handleDelete = async (announcement: Announcement) => {
    if (window.confirm(`Are you sure you want to delete "${announcement.title}"?`)) {
      try {
        const response = await apiService.delete<{ success: boolean; message: string }>(
          `/announcements/${announcement._id}`
        );
        
        if (response.success) {
          fetchAnnouncements();
        } else {
          setError(response.message || 'Failed to delete announcement');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete announcement');
      }
    }
  };

  const handleCreate = () => {
    navigate('/announcements/create');
  };

  const handlePin = async (announcement: Announcement) => {
    try {
      const response = await apiService.patch<{ success: boolean; message: string }>(
        `/announcements/${announcement._id}/pin`,
        { isPinned: !announcement.isPinned }
      );
      
      if (response.success) {
        fetchAnnouncements();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update pin status');
    }
  };

  const priorities: AnnouncementPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const statuses: AnnouncementStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent mb-2">
            Announcements
          </h1>
          <p className="text-gray-500">
            {role === 'ADMIN' ? 'Manage all announcements' : 
             role === 'ORGANIZER' ? 'Manage your announcements' : 
             'Announcements for you'}
          </p>
        </div>
        
        {(role === 'ADMIN' || role === 'ORGANIZER') && (
          <Button onClick={handleCreate} className="self-start lg:self-center">
            <Plus className="w-5 h-5" />
            Create Announcement
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
              placeholder="Search announcements..."
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
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tangerine-500 focus:border-tangerine-500 outline-none"
            >
              <option value="">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority} value={priority}>{getPriorityText(priority)}</option>
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
            
            <Button
              variant="outline"
              onClick={() => {
                setPriorityFilter('');
                setStatusFilter('');
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
        /* Announcements List */
        <>
          {filteredAnnouncements.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Announcements Found</h3>
              <p className="text-gray-500">
                {role === 'VOLUNTEER' 
                  ? 'No announcements are currently available.'
                  : 'You have not created any announcements yet.'}
              </p>
              
              {(role === 'ADMIN' || role === 'ORGANIZER') && (
                <Button onClick={handleCreate} className="mt-6">
                  <Plus className="w-5 h-5" />
                  Create Your First Announcement
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredAnnouncements.map((announcement, index) => (
                <motion.div
                  key={announcement._id as string || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className={`p-4 ${announcement.isPinned ? 'border-orchid-200 bg-orchid-50' : ''}`}>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{announcement.title}</h3>
                          {announcement.isPinned && (
                            <Pin className="w-5 h-5 text-orchid-500" />
                          )}
                        </div>
                        
                        <p className="text-gray-500 mb-3 line-clamp-2">{announcement.message}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                            {getPriorityText(announcement.priority)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(announcement.status)}`}>
                            {getStatusText(announcement.status)}
                          </span>
                          {announcement.publishedAt && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(announcement.publishedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          {announcement.tags && announcement.tags.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4" />
                              <span>{announcement.tags.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{announcement.likeCount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            <span>{announcement.commentCount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>{announcement.readCount}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {(role === 'ADMIN' || role === 'ORGANIZER') && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePin(announcement)}
                              className="p-1.5"
                            >
                              <Pin className={`w-4 h-4 ${announcement.isPinned ? 'text-orchid-500' : 'text-gray-400'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(announcement)}
                              className="p-1.5"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(announcement)}
                              className="p-1.5 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(announcement)}
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

export default AnnouncementListPage;
