import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Save, Plus, X, Type, Palette, Target } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';
import Badge, { UpdateBadge, BadgeCategory, BadgeRarity, BadgeCriteria  } from '../../types/badge';

const BadgeEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<UpdateBadge & {
    name: string;
    description: string;
    shortDescription: string;
    category: BadgeCategory;
    rarity: BadgeRarity;
    icon: string;
    iconColor: string;
    backgroundColor: string;
    borderColor: string;
    criteria: BadgeCriteria;
    points: number;
    isActive: boolean;
    order: number;
  }>({
    name: '',
    description: '',
    shortDescription: '',
    category: 'PARTICIPATION',
    rarity: 'COMMON',
    icon: '⭐',
    iconColor: '#FF7A33',
    backgroundColor: '#FFF7F0',
    borderColor: '#FF9559',
    criteria: { type: 'EVENT_COUNT', target: 1, operator: 'GTE' },
    points: 10,
    isActive: true,
    order: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadge = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiService.get<{ success: boolean; data: Badge; message?: string }>(
          `/badges/${id}`
        );
        
        if (response.success) {
          const badge = response.data;
          setFormData({
            name: badge.name,
            description: badge.description,
            shortDescription: badge.shortDescription || '',
            category: badge.category,
            rarity: badge.rarity,
            icon: badge.icon,
            iconColor: badge.iconColor,
            backgroundColor: badge.backgroundColor,
            borderColor: badge.borderColor,
            criteria: badge.criteria,
            points: badge.points,
            isActive: badge.isActive,
            order: badge.order,
          });
        } else {
          setError(response.message || 'Failed to fetch badge');
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

  const handleCriteriaChange = (field: 'type' | 'target' | 'operator', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate required fields
      if (!formData.name || !formData.category || !formData.rarity) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      const response = await apiService.put<{ success: boolean; data: any; message?: string }>(
        `/badges/${id}`,
        formData
      );
      
      if (response.success) {
        setSuccess('Badge updated successfully!');
        setTimeout(() => {
          navigate(`/badges/${id}`);
        }, 1500);
      } else {
        setError(response.message || 'Failed to update badge');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update badge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: BadgeCategory[] = ['PARTICIPATION', 'PERFORMANCE', 'SKILLS', 'TIME', 'ACHIEVEMENT', 'SPECIAL'];
  const rarities: BadgeRarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
  const criteriaTypes = ['EVENT_COUNT', 'VOLUNTEER_HOURS', 'TASKS_COMPLETED', 'PERFORMANCE_SCORE', 'SPECIAL_ACHIEVEMENT', 'SKILLS_MASTERED', 'TEAMWORK', 'PUNCTUALITY'];
  const operators = ['GTE', 'LTE', 'EQ', 'GT', 'LT'];

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
        <Button variant="ghost" onClick={() => navigate(`/badges/${id}`)} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent">
          Edit Badge
        </h1>
      </div>

      <Card className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Badge Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter badge name..."
                required
              />
              
              <Input
                label="Category *"
                name="category"
                type="select"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Input>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Rarity *"
                name="rarity"
                type="select"
                value={formData.rarity}
                onChange={handleChange}
                required
              >
                <option value="">Select Rarity</option>
                {rarities.map(rarity => (
                  <option key={rarity} value={rarity}>{rarity}</option>
                ))}
              </Input>
              
              <Input
                label="Points"
                name="points"
                type="number"
                value={formData.points}
                onChange={handleChange}
                placeholder="Enter points value"
                min={0}
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Description *"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the badge..."
                multiline
                rows={3}
                required
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Short Description (Optional)"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="Brief description for display"
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Icon (Emoji or Icon Name)"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="Enter an emoji or icon name"
              />
            </div>
          </div>

          {/* Color Scheme */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Color Scheme</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Icon Color"
                name="iconColor"
                type="color"
                value={formData.iconColor}
                onChange={handleChange}
              />
              
              <Input
                label="Background Color"
                name="backgroundColor"
                type="color"
                value={formData.backgroundColor}
                onChange={handleChange}
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Border Color"
                name="borderColor"
                type="color"
                value={formData.borderColor}
                onChange={handleChange}
              />
            </div>
            
            {/* Preview */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Preview</h3>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center border-4"
                  style={{ 
                    backgroundColor: formData.backgroundColor,
                    borderColor: formData.borderColor
                  }}
                >
                  <span className="text-2xl" style={{ color: formData.iconColor }}>
                    {formData.icon}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{formData.name}</p>
                  <p className="text-gray-500 text-sm">{formData.shortDescription || formData.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Criteria */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Criteria</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Criteria Type"
                name="criteriaType"
                type="select"
                value={formData.criteria.type}
                onChange={(e) => handleCriteriaChange('type', e.target.value)}
              >
                {criteriaTypes.map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </Input>
              
              <Input
                label="Operator"
                name="operator"
                type="select"
                value={formData.criteria.operator}
                onChange={(e) => handleCriteriaChange('operator', e.target.value)}
              >
                {operators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </Input>
            </div>
            
            <div className="mt-4">
              <Input
                label="Target Value"
                name="target"
                type="number"
                value={formData.criteria.target}
                onChange={(e) => handleCriteriaChange('target', parseInt(e.target.value) || 0)}
                placeholder="Enter target value"
                min={0}
              />
            </div>
            
            {formData.criteria.timeframe && (
              <div className="mt-4">
                <Input
                  label="Timeframe"
                  name="timeframe"
                  type="select"
                  value={formData.criteria.timeframe}
                  onChange={(e) => handleCriteriaChange('timeframe' as any, e.target.value)}
                >
                  <option value="ALL_TIME">All Time</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="WEEKLY">Weekly</option>
                </Input>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-tangerine-500 rounded focus:ring-tangerine-500"
                />
                <label htmlFor="isActive" className="text-gray-700 cursor-pointer">
                  Badge is active
                </label>
              </div>
              
              <Input
                label="Order"
                name="order"
                type="number"
                value={formData.order}
                onChange={handleChange}
                placeholder="Display order"
                min={0}
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
            <Button type="button" variant="outline" onClick={() => navigate(`/badges/${id}`)}>
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

export default BadgeEditPage;
