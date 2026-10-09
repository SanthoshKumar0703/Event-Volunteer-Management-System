import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Clock, AlertTriangle, Wrench } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative w-20 h-20 mx-auto">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />
            <Wrench className="absolute inset-0 w-full h-full text-primary-500 mx-auto my-auto" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-primary mb-4"
        >
          Under Maintenance
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-muted mb-8"
        >
          We're currently performing maintenance to improve your experience.
          Please check back later.
        </motion.p>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card variant="elevated" size="lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted">
                <Clock className="w-5 h-5" />
                <span>Estimated Time: 30 minutes</span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <AlertTriangle className="w-5 h-5" />
                <span>Status: Maintenance in progress</span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <Settings className="w-5 h-5" />
                <span>Type: System Update</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="primary"
            size="md"
            onClick={() => window.location.reload()}
            fullWidth
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => window.location.href = '/'}
            fullWidth
          >
            Go Home
          </Button>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          className="absolute top-20 left-20 w-12 h-12 rounded-full bg-primary-500/20"
          animate={{ 
            y: [0, -15, 0],
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-16 h-16 rounded-full bg-accent-500/20"
          animate={{ 
            y: [0, -10, 0],
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
