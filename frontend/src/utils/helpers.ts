import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid, formatDistanceToNow, fromUnixTime } from 'date-fns';

// Tailwind class name merging
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export const formatDate = (date: string | Date, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!date) return '';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) return '';
    return format(parsedDate, formatStr);
  } catch {
    return '';
  }
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

export const formatRelativeDate = (date: string | Date): string => {
  if (!date) return '';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) return '';
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  } catch {
    return '';
  }
};

export const formatTime = (time: string): string => {
  if (!time) return '';
  
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${period}`;
  } catch {
    return time;
  }
};

// String utilities
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const capitalizeWords = (str: string): string => {
  if (!str) return '';
  return str.split(' ').map(capitalize).join(' ');
};

export const truncate = (str: string, length: number): string => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const pluralize = (count: number, singular: string, plural?: string): string => {
  if (!plural) {
    plural = singular + 's';
  }
  return count === 1 ? singular : plural;
};

// Number utilities
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const abbreviateNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num >= 1000 && num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num >= 1000000 && num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'B';
};

// Color utilities
export const getColorForStatus = (status: string): string => {
  const statusColors: Record<string, string> = {
    active: 'text-success-500',
    completed: 'text-success-500',
    pending: 'text-warning-500',
    cancelled: 'text-error-500',
    rejected: 'text-error-500',
    approved: 'text-success-500',
    draft: 'text-muted',
    published: 'text-primary-500',
    archived: 'text-muted',
  };
  return statusColors[status.toLowerCase()] || 'text-muted';
};

export const getBackgroundColorForStatus = (status: string): string => {
  const statusColors: Record<string, string> = {
    active: 'bg-success-100',
    completed: 'bg-success-100',
    pending: 'bg-warning-100',
    cancelled: 'bg-error-100',
    rejected: 'bg-error-100',
    approved: 'bg-success-100',
    draft: 'bg-surface-secondary',
    published: 'bg-primary-100',
    archived: 'bg-surface-secondary',
  };
  return statusColors[status.toLowerCase()] || 'bg-surface-secondary';
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const isValidPassword = (password: string, minLength: number = 8): boolean => {
  if (password.length < minLength) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  return true;
};

// Storage utilities
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Session storage utilities
export const getFromSession = <T>(key: string, defaultValue: T): T => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setToSession = <T>(key: string, value: T): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to sessionStorage:', error);
  }
};

// Debounce utility
export const debounce = <F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  wait: number
): ((...args: Parameters<F>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  limit: number
): ((...args: Parameters<F>) => void) => {
  let inThrottle = false;
  
  return (...args: Parameters<F>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Generate avatar from name
export const getAvatarFromName = (name: string, size: number = 100): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Background color based on name
  const colors = [
    '#FF7A33', '#FFAB33', '#B064FF',
    '#10B981', '#3B82F6', '#F59E0B',
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  
  // Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${size / 2}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  ctx.fillText(initials, size / 2, size / 2);
  
  return canvas.toDataURL();
};

// Format duration
export const formatDuration = (start: string | Date, end: string | Date): string => {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  
  if (!isValid(startDate) || !isValid(endDate)) return '';
  
  const diffInMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  const remainingMinutes = diffInMinutes % 60;
  
  if (diffInHours < 24) {
    return remainingMinutes > 0 ? `${diffInHours}h ${remainingMinutes}m` : `${diffInHours}h`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  const remainingHours = diffInHours % 24;
  
  return remainingHours > 0 ? `${diffInDays}d ${remainingHours}h` : `${diffInDays}d`;
};

// Calculate match score color
export const getMatchScoreColor = (score: number): string => {
  if (score >= 80) return 'text-success-500';
  if (score >= 60) return 'text-warning-500';
  if (score >= 40) return 'text-accent-500';
  return 'text-error-500';
};

// Calculate match score background
export const getMatchScoreBackground = (score: number): string => {
  if (score >= 80) return 'bg-success-100';
  if (score >= 60) return 'bg-warning-100';
  if (score >= 40) return 'bg-accent-100';
  return 'bg-error-100';
};

// Get initials from name
export const getInitials = (name: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Get full name from first and last name
export const getFullName = (firstName: string, lastName: string): string => {
  return [firstName, lastName].filter(Boolean).join(' ');
};

// Export all utilities
export {
  clsx,
  twMerge,
};
