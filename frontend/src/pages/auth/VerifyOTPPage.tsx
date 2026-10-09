import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, ArrowRight, ArrowLeft, Clock, RefreshCw } from 'lucide-react';
import Button from '../../components/common/Button';
import { apiVerifyOTP, apiResendOTP } from '../../utils/api';

const VerifyOTPPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';
  
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');
    
    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      setOtp(pastedData.split(''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit OTP code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await apiVerifyOTP({
        email,
        otp: otpCode
      });
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/reset-password/${response.token}`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    try {
      const response = await apiResendOTP({ email });
      if (response.success) {
        setTimeLeft(300);
        setCanResend(false);
        setOtp(Array(6).fill(''));
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

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
          <ShieldCheck className="w-16 h-16 text-tangerine-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">OTP Verified!</h2>
          <p className="text-gray-600 mb-6">Redirecting to reset password page...</p>
        </motion.div>
      </motion.div>
    );
  }

  if (!email) {
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Request</h2>
          <p className="text-gray-600 mb-6">
            No email provided. Please start the password reset process again.
          </p>
          <Link to="/forgot-password">
            <Button className="w-full">
              Request OTP
            </Button>
          </Link>
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
            Verify OTP
          </h1>
          <p className="text-gray-500">
            Enter the 6-digit code sent to <span className="font-medium text-tangerine-500">{email}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-12 text-center text-xl font-mono border-2 border-gray-200 rounded-lg focus:border-tangerine-500 focus:outline-none focus:ring-2 focus:ring-tangerine-200 transition-colors"
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-tangerine-500 to-orchid-500 hover:from-tangerine-600 hover:to-orchid-600"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Resend code in {formatTime(timeLeft)}</span>
          </div>
          
          <Button
            onClick={handleResend}
            disabled={!canResend || isLoading}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Resend
          </Button>
        </div>

        <p className="text-center text-gray-500 mt-6">
          Didn't receive a code?{' '}
          <Link to="/forgot-password" className="text-tangerine-500 hover:underline font-medium">
            Try again
          </Link>
        </p>

        <p className="text-center text-gray-500 mt-2">
          <Link to="/login" className="text-tangerine-500 hover:underline font-medium flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default VerifyOTPPage;
