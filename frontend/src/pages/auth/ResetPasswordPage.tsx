import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { apiResetPassword } from '../../utils/api';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    if (!token) {
      setErrors(prev => ({ ...prev, general: 'Invalid reset token' }));
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await apiResetPassword({
        token,
        password: formData.password
      });
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error: any) {
      if (error.message.includes('token') || error.message.includes('Token')) {
        setIsValidToken(false);
      }
      setErrors(prev => ({ ...prev, general: error.message || 'Password reset failed' }));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orchid-50 via-apricot-50 to-tangerine-50"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Token</h2>
          <p className="text-gray-600 mb-6">
            The password reset token is invalid or has expired. Please request a new reset link.
          </p>
          <div className="space-y-3">
            <Link to="/forgot-password">
              <Button className="w-full" variant="outline">
                Request New Link
              </Button>
            </Link>
            <Link to="/login">
              <Button className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orchid-50 via-apricot-50 to-tangerine-50"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center"
        >
          <CheckCircle className="w-16 h-16 text-tangerine-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Updated!</h2>
          <p className="text-gray-600 mb-6">Your password has been reset successfully. Redirecting to login...</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orchid-50 via-apricot-50 to-tangerine-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-tangerine-500 to-orchid-500 bg-clip-text text-transparent mb-2">
            Reset Password
          </h1>
          <p className="text-gray-500">Enter your new password below</p>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            icon={<Lock className="w-5 h-5 text-gray-400" />}
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="New Password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            appendIcon={
              showPassword ? (
                <EyeOff
                  className="w-5 h-5 text-gray-400 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                />
              ) : (
                <Eye
                  className="w-5 h-5 text-gray-400 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                />
              )
            }
          />

          <Input
            icon={<Lock className="w-5 h-5 text-gray-400" />}
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="Confirm New Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            appendIcon={
              showConfirmPassword ? (
                <EyeOff
                  className="w-5 h-5 text-gray-400 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              ) : (
                <Eye
                  className="w-5 h-5 text-gray-400 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              )
            }
          />

          <p className="text-xs text-gray-500">
            Password must be at least 8 characters long
          </p>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-tangerine-500 to-orchid-500 hover:from-tangerine-600 hover:to-orchid-600"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>

        <p className="text-center text-gray-500 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-tangerine-500 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ResetPasswordPage;
