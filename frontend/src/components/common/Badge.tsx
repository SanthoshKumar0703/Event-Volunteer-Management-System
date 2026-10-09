import React, { ReactNode, HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/helpers';

// Badge variants
const badgeVariants = {
  // Primary variants
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  primarySolid: 'bg-primary-500 text-white',
  
  // Secondary variants
  secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
  secondarySolid: 'bg-secondary-500 text-white',
  
  // Accent variants
  accent: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
  accentSolid: 'bg-accent-500 text-white',
  
  // Semantic variants
  success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  successSolid: 'bg-success-500 text-white',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
  warningSolid: 'bg-warning-500 text-white',
  error: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300',
  errorSolid: 'bg-error-500 text-white',
  info: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300',
  infoSolid: 'bg-info-500 text-white',
  
  // Neutral variants
  neutral: 'bg-surface-secondary text-muted',
  neutralSolid: 'bg-charcoal text-white dark:bg-white dark:text-charcoal',
  
  // Light variants
  light: 'bg-white text-charcoal border border-border-light',
  lightSolid: 'bg-white text-charcoal',
  
  // Dark variants
  dark: 'bg-charcoal text-white',
  darkSolid: 'bg-charcoal text-white',
};

// Badge sizes
const badgeSizes = {
  xs: 'px-2 py-0.5 text-xs',
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
  xl: 'px-5 py-2 text-lg',
};

// Badge rounded variants
const badgeRounded = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

// Interface for badge props
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
  size?: keyof typeof badgeSizes;
  rounded?: keyof typeof badgeRounded;
  dot?: boolean;
  dotColor?: string;
  motionProps?: HTMLMotionProps<'span'>;
  disableMotion?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Main Badge component
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      rounded = 'full',
      dot = false,
      dotColor,
      motionProps,
      disableMotion = false,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-1.5 font-medium
      ${badgeVariants[variant] || badgeVariants.primary}
      ${badgeSizes[size] || badgeSizes.md}
      ${badgeRounded[rounded] || badgeRounded.full}
    `;

    const combinedClassName = cn(baseClasses, className);

    // Motion props with defaults
    const defaultMotionProps: HTMLMotionProps<'span'> = {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.2, ease: 'easeOut' },
    };

    // If disableMotion, render as span
    if (disableMotion) {
      return (
        <span
          ref={ref}
          className={combinedClassName}
          {...props}
        >
          {dot && (
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                dotColor || 'bg-current'
              )}
              aria-hidden="true"
            />
          )}
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>
      );
    }

    // Render with motion - only pass motion-compatible props
    const motionOnlyProps = {
      ...defaultMotionProps,
      ...motionProps,
    };
    
    // Filter out non-HTML props from props
    const htmlProps = props as Omit<BadgeProps, keyof typeof motionOnlyProps | 'variant' | 'size' | 'rounded' | 'dot' | 'dotColor' | 'motionProps' | 'disableMotion' | 'leftIcon' | 'rightIcon'>;

    return (
      <motion.span
        ref={ref}
        className={combinedClassName}
        {...motionOnlyProps}
        {...htmlProps}
      >
        {dot && (
          <motion.span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              dotColor || 'bg-current'
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            aria-hidden="true"
          />
        )}
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </motion.span>
    );
  }
);

// Status Badge
export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'rejected' | 'approved' | string;
  size?: keyof typeof badgeSizes;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const statusConfig: Record<string, { variant: keyof typeof badgeVariants; label: string }> = {
    active: { variant: 'successSolid', label: 'Active' },
    inactive: { variant: 'neutral', label: 'Inactive' },
    pending: { variant: 'warningSolid', label: 'Pending' },
    completed: { variant: 'successSolid', label: 'Completed' },
    cancelled: { variant: 'error', label: 'Cancelled' },
    rejected: { variant: 'errorSolid', label: 'Rejected' },
    approved: { variant: 'successSolid', label: 'Approved' },
    draft: { variant: 'neutral', label: 'Draft' },
    published: { variant: 'primarySolid', label: 'Published' },
    archived: { variant: 'neutral', label: 'Archived' },
  };

  const config = statusConfig[status.toLowerCase()] || { variant: 'neutral', label: status };

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={className}
    >
      {config.label}
    </Badge>
  );
};

// Priority Badge
export interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  size?: keyof typeof badgeSizes;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  className = '',
}) => {
  const priorityConfig: Record<string, { variant: keyof typeof badgeVariants; label: string }> = {
    low: { variant: 'neutral', label: 'Low' },
    medium: { variant: 'info', label: 'Medium' },
    high: { variant: 'warningSolid', label: 'High' },
    urgent: { variant: 'errorSolid', label: 'Urgent' },
  };

  const config = priorityConfig[priority.toLowerCase()] || { variant: 'neutral', label: priority };

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={className}
    >
      {config.label}
    </Badge>
  );
};

// Role Badge
export interface RoleBadgeProps {
  role: 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER' | string;
  size?: keyof typeof badgeSizes;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  className = '',
}) => {
  const roleConfig: Record<string, { variant: keyof typeof badgeVariants; label: string }> = {
    ADMIN: { variant: 'errorSolid', label: 'Admin' },
    ORGANIZER: { variant: 'primarySolid', label: 'Organizer' },
    VOLUNTEER: { variant: 'successSolid', label: 'Volunteer' },
  };

  const config = roleConfig[role] || { variant: 'neutral', label: role };

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={className}
    >
      {config.label}
    </Badge>
  );
};

// Category Badge
export interface CategoryBadgeProps {
  category: string;
  size?: keyof typeof badgeSizes;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'md',
  className = '',
}) => {
  // Map common categories to colors
  const categoryConfig: Record<string, { variant: keyof typeof badgeVariants }> = {
    CONFERENCE: { variant: 'primary' },
    CONCERT: { variant: 'accent' },
    FESTIVAL: { variant: 'secondary' },
    SPORTS: { variant: 'success' },
    CHARITY: { variant: 'error' },
    COMMUNITY: { variant: 'warning' },
    CORPORATE: { variant: 'info' },
    EDUCATION: { variant: 'accent' },
    HEALTH: { variant: 'success' },
    ENVIRONMENT: { variant: 'primary' },
    ARTS: { variant: 'secondary' },
    TECHNOLOGY: { variant: 'info' },
    FOOD: { variant: 'warning' },
    OTHER: { variant: 'neutral' },
  };

  const config = categoryConfig[category] || { variant: 'neutral' };

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={className}
    >
      {category}
    </Badge>
  );
};

// Notification Badge (for unread count)
export interface NotificationBadgeProps {
  count: number;
  max?: number;
  size?: keyof typeof badgeSizes;
  className?: string;
  showZero?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  size = 'sm',
  className = '',
  showZero = false,
}) => {
  if (!showZero && count === 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <Badge
      variant="errorSolid"
      size={size}
      rounded="full"
      className={className}
    >
      {displayCount}
    </Badge>
  );
};

// Avatar Badge (for user avatars)
export interface AvatarBadgeProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  showStatus?: boolean;
  className?: string;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  src,
  alt = 'User',
  name,
  size = 'md',
  status,
  showStatus = true,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const statusClasses = {
    online: 'bg-success-500',
    offline: 'bg-muted',
    busy: 'bg-error-500',
    away: 'bg-warning-500',
  };

  const initials = name 
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : alt.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-medium',
          sizeClasses[size],
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white">
            {initials}
          </div>
        )}
      </div>
      {showStatus && status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface',
            statusClasses[status]
          )}
        />
      )}
    </div>
  );
};

export default Badge;
