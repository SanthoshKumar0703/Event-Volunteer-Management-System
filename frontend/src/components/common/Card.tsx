import React, { ReactNode, HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/helpers';

// Card variants
const cardVariants = {
  default: 'bg-surface border border-border-light dark:border-border-medium',
  elevated: 'bg-surface shadow-soft border border-border-light dark:border-border-medium',
  flat: 'bg-surface',
  glass: 'bg-surface/80 backdrop-blur-sm border border-border-light/20 dark:border-border-medium/20',
  primary: 'bg-primary-500 text-white border border-primary-600',
  secondary: 'bg-secondary-500 text-white border border-secondary-600',
  accent: 'bg-accent-500 text-white border border-accent-600',
  outline: 'bg-transparent border border-primary-500',
};

// Card sizes
const cardSizes = {
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

// Card rounded variants
const cardRounded = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

// Interface for card props
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof cardVariants;
  size?: keyof typeof cardSizes;
  rounded?: keyof typeof cardRounded;
  hoverable?: boolean;
  clickable?: boolean;
  motionProps?: HTMLMotionProps<'div'>;
  disableMotion?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
}

// Main Card component
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      rounded = 'lg',
      hoverable = false,
      clickable = false,
      motionProps,
      disableMotion = false,
      header,
      footer,
      actions,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      transition-all duration-200
      ${cardVariants[variant] || cardVariants.default}
      ${cardSizes[size] || cardSizes.md}
      ${cardRounded[rounded] || cardRounded.md}
      ${hoverable && 'hover:shadow-md hover:-translate-y-0.5'}
      ${clickable && 'cursor-pointer active:scale-[0.98]'}
    `;

    const combinedClassName = cn(baseClasses, className);

    // Motion props with defaults
    const defaultMotionProps: HTMLMotionProps<'div'> = {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      transition: { duration: 0.3, ease: 'easeOut' },
    };

    // If disableMotion, render as div
    if (disableMotion) {
      return (
        <div
          ref={ref}
          className={combinedClassName}
          {...props}
        >
          {header && <div className="mb-4">{header}</div>}
          {children}
          {footer && <div className="mt-4 pt-4 border-t border-border-light dark:border-border-medium">{footer}</div>}
          {actions && <div className="mt-4">{actions}</div>}
        </div>
      );
    }

    // @ts-ignore - Type mismatch between HTML props and motion props
    return (
      <motion.div
        ref={ref}
        className={combinedClassName}
        {...defaultMotionProps}
        {...motionProps}
        {...props}
      >
        {header && <div className="mb-4">{header}</div>}
        {children}
        {footer && <div className="mt-4 pt-4 border-t border-border-light dark:border-border-medium">{footer}</div>}
        {actions && <div className="mt-4">{actions}</div>}
      </motion.div>
    );
  }
);

// Card Header
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  description,
  actions,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4',
        className
      )}
      {...props}
    >
      <div className="flex-1">
        {title && (
          <h3 className="text-lg font-semibold text-primary mb-1">{title}</h3>
        )}
        {description && (
          <p className="text-sm text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
};

// Card Content
export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn('text-sm text-secondary', className)}
      {...props}
    />
  );
};

// Card Footer
export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 text-sm',
        className
      )}
      {...props}
    />
  );
};

// Card Actions
export const CardActions: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2',
        className
      )}
      {...props}
    />
  );
};

// Stats Card
export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  trend?: number;
  trendType?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  trendType = 'up',
  className = '',
}) => {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    accent: 'from-accent-500 to-accent-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    error: 'from-error-500 to-error-600',
  };

  const trendColor = {
    up: 'text-success-500',
    down: 'text-error-500',
    neutral: 'text-muted',
  };

  const trendIcon = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <Card
      variant="elevated"
      size="lg"
      className={cn('text-center', className)}
    >
      <div className="flex items-center justify-center gap-4 mb-4">
        {icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
            {icon}
          </div>
        )}
        <div className="text-left">
          <motion.p
            className="text-3xl font-bold text-charcoal dark:text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {value}
          </motion.p>
          <motion.p
            className="text-sm text-muted mt-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {title}
          </motion.p>
        </div>
      </div>
      {trend !== undefined && (
        <motion.div
          className={`text-xs font-medium ${trendColor[trendType]} flex items-center justify-center gap-1`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span>{trendIcon[trendType]}</span>
          <span>{Math.abs(trend)}%</span>
        </motion.div>
      )}
    </Card>
  );
};

// Feature Card
export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href?: string;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  href,
  className = '',
}) => {
  const content = (
    <Card
      variant="elevated"
      size="lg"
      hoverable
      className={cn('h-full', className)}
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-muted text-sm">{description}</p>
    </Card>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
};

// Empty State Card
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <Card
      variant="glass"
      size="xl"
      className={cn(
        'text-center flex flex-col items-center justify-center py-12',
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-muted text-sm mb-6 max-w-sm">{description}</p>
      )}
      {action && <div>{action}</div>}
    </Card>
  );
};

// Skeleton Card
export interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  lines = 3,
}) => {
  return (
    <Card
      variant="default"
      size="lg"
      className={cn('animate-pulse', className)}
    >
      <div className="space-y-3">
        <div className="h-4 bg-surface-secondary rounded w-3/4" />
        <div className="h-4 bg-surface-secondary rounded w-1/2" />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-3 bg-surface-secondary rounded w-full" />
        ))}
      </div>
    </Card>
  );
};

export default Card;
