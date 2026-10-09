import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import Button from './Button';

interface ScrollToTopProps {
  threshold?: number;
  className?: string;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({
  threshold = 100,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Check scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={className}
        >
          <Button
            variant="primary"
            size="sm"
            rounded="full"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="fixed bottom-6 right-6 z-50 shadow-lg shadow-primary/30"
            leftIcon={<ChevronUp className="w-5 h-5" />}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
