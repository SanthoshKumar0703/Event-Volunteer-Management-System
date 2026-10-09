import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogIn, Sun, Moon, Monitor, Sparkles } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { EventFlowLogo } from '../common/LoadingScreen';

const PublicHeader: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  // Check scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Navigation items
  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Contact', href: '#contact' },
  ];

  // Theme menu items
  const themeItems = [
    { label: 'Light', value: 'LIGHT' as const, icon: Sun },
    { label: 'Dark', value: 'DARK' as const, icon: Moon },
    { label: 'System', value: 'SYSTEM' as const, icon: Monitor },
  ];

  // Toggle menu
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled 
          ? 'bg-surface/90 backdrop-blur-sm shadow-soft' 
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <EventFlowLogo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  'hover:text-primary-500 text-muted'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-10 h-10 p-0"
                leftIcon={actualTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              />
            </div>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  leftIcon={<LogIn className="w-4 h-4" />}
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="w-10 h-10 p-0"
              leftIcon={isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-surface border-t border-border-light dark:border-border-medium"
            >
              <div className="px-4 py-4 space-y-4">
                {/* Mobile Navigation */}
                <nav className="flex flex-col gap-3">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={cn(
                        'text-sm font-medium transition-colors py-2',
                        'hover:text-primary-500 text-muted'
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {/* Theme Selection */}
                <div className="pt-4 border-t border-border-light dark:border-border-medium">
                  <p className="text-xs text-muted mb-2">Theme</p>
                  <div className="flex gap-2">
                    {themeItems.map((item) => (
                      <Button
                        key={item.value}
                        variant={theme === item.value ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setTheme(item.value)}
                        className="flex-1"
                        leftIcon={<item.icon className="w-4 h-4" />}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Auth Actions */}
                <div className="pt-4 border-t border-border-light dark:border-border-medium flex flex-col gap-3">
                  {isAuthenticated ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigate('/dashboard');
                          setIsMenuOpen(false);
                        }}
                      >
                        Dashboard
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigate('/login');
                          setIsMenuOpen(false);
                        }}
                        leftIcon={<LogIn className="w-4 h-4" />}
                      >
                        Login
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          navigate('/register');
                          setIsMenuOpen(false);
                        }}
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default PublicHeader;
