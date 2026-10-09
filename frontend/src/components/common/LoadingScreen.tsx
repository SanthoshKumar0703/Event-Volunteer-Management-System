import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// EventFlow Logo Component
const EventFlowLogo: React.FC = () => (
  <motion.div
    className="flex items-center justify-center gap-3"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    {/* Logo Icon */}
    <motion.div
      className="relative w-12 h-12 flex items-center justify-center"
      whileHover={{ rotate: [0, -10, 10, 0] }}
      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'loop' }}
    >
      {/* Outer ring */}
      <motion.div
        className="absolute w-full h-full rounded-full border-2 border-primary-300"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Inner circles representing connection */}
      <motion.div
        className="absolute w-3 h-3 rounded-full bg-primary-500 top-2 left-2"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-accent-500 bottom-2 right-2"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1]
        }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute w-2.5 h-2.5 rounded-full bg-secondary-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [1, 0.9, 1]
        }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.25 }}
      />
    </motion.div>
    
    {/* Logo Text */}
    <motion.div
      className="flex flex-col"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
        EventFlow
      </span>
      <span className="text-sm text-muted -mt-1 hidden sm:block">
        Event Volunteer Management
      </span>
    </motion.div>
  </motion.div>
);

// Animated Loading Dots
const LoadingDots: React.FC = () => (
  <div className="flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full bg-current"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ 
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.2,
          ease: 'easeInOut'
        }}
      />
    ))}
  </div>
);

// Loading Spinner
const LoadingSpinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <motion.div
    className={`flex items-center justify-center ${className}`}
    animate={{ rotate: 360 }}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
  >
    <Loader2 className="w-8 h-8 text-primary-500" />
  </motion.div>
);

// Main Loading Screen Component
interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Bringing people together...',
  showLogo = true
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-surface">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl"
          animate={{ 
            x: [100, -100, 100],
            y: [-100, 100, -100],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent-500/10 blur-3xl"
          animate={{ 
            x: [-100, 100, -100],
            y: [100, -100, 100],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-secondary-500/5 blur-2xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      
      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center gap-6 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {showLogo && <EventFlowLogo />}
        
        {/* Loading Animation */}
        <div className="flex items-center gap-4">
          <LoadingSpinner />
          <motion.span
            className="text-lg text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {message}
          </motion.span>
          <LoadingDots />
        </div>
        
        {/* Progress Bar */}
        <motion.div
          className="w-64 h-1 bg-surface-secondary rounded-full overflow-hidden"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 256 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, delay: 0.8, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;

export { EventFlowLogo, LoadingSpinner, LoadingDots };
