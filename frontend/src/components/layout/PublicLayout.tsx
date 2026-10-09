import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

// Components
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

interface PublicLayoutProps {
  children?: ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-primary transition-colors duration-300">
      {/* Header */}
      <PublicHeader />
      
      {/* Main Content */}
      <motion.main
        className="flex-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {children || <Outlet />}
      </motion.main>
      
      {/* Footer */}
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
