import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <AlertCircle className="w-20 h-20 text-error-500 mx-auto" />
        </motion.div>

        {/* Error Code */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-6xl sm:text-8xl font-bold text-gradient mb-4"
        >
          404
        </motion.h1>

        {/* Error Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-muted mb-8"
        >
          Page Not Found
        </motion.p>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card variant="elevated" size="lg" className="max-w-md mx-auto">
            <div className="space-y-4">
              <p className="text-muted">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => window.history.back()}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  fullWidth
                >
                  Go Back
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => window.location.href = '/'}
                  leftIcon={<Home className="w-4 h-4" />}
                  fullWidth
                >
                  Go Home
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          className="absolute top-20 left-20 w-16 h-16 rounded-full bg-primary-500/20"
          animate={{ 
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-20 h-20 rounded-full bg-accent-500/20"
          animate={{ 
            y: [0, -15, 0],
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
