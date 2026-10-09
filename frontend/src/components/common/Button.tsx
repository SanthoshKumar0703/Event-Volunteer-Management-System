import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/helpers';

// Button variants
const buttonVariants = {
  // Primary button - Tangerine
  primary: 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white border border-primary-500 hover:border-primary-600',
  
  // Secondary button - Apricot
  secondary: 'bg-secondary-500 hover:bg-secondary-600 active:bg-secondary-700 text-white border border-secondary-500 hover:border-secondary-600',
  
  // Accent button - Orchid
  accent: 'bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white border border-accent-500 hover:border-accent-600',
  
  // Ghost button
  ghost: 'bg-transparent hover:bg-surface-secondary active:bg-surface-tertiary text-primary-600 dark:text-primary-400 border border-transparent hover:border-primary-300 dark:hover:border-primary-700',
  
  // Outline button
  outline: 'bg-transparent hover:bg-primary-50 dark:hover:bg-primary-950/20 text-primary-600 dark:text-primary-400 border border-primary-500 hover:border-primary-600 dark:border-primary-700',
  
  // Light button
  light: 'bg-white hover:bg-surface-secondary active:bg-surface-tertiary text-charcoal border border-border-light dark:border-border-medium',
  
  // Dark button
  dark: 'bg-charcoal hover:bg-charcoal-soft active:bg-charcoal-light text-white border border-charcoal-soft',
  
  // Success button
  success: 'bg-success-500 hover:bg-success-600 active:bg-success-700 text-white border border-success-500 hover:border-success-600',
  
  // Warning button
  warning: 'bg-warning-500 hover:bg-warning-600 active:bg-warning-700 text-white border border-warning-500 hover:border-warning-600',
  
  // Error/Danger button
  error: 'bg-error-500 hover:bg-error-600 active:bg-error-700 text-white border border-error-500 hover:border-error-600',
  
  // Link button
  link: 'bg-transparent hover:bg-transparent active:bg-transparent text-primary-600 dark:text-primary-400 underline hover:no-underline p-0',
};

// Button sizes
const buttonSizes = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-2.5 text-lg gap-2.5',
  xl: 'px-8 py-3 text-xl gap-3',
};

// Button rounded variants
const buttonRounded = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

// Interface for button props
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  rounded?: keyof typeof buttonRounded;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  motionProps?: HTMLMotionProps<'button'>;
  disableMotion?: boolean;
  fullWidth?: boolean;
}

// Main Button component
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      rounded = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      fullWidth = false,
      motionProps,
      disableMotion = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      flex items-center justify-center font-medium transition-all duration-200
      focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${fullWidth ? 'w-full' : ''}
      ${buttonVariants[variant] || buttonVariants.primary}
      ${buttonSizes[size] || buttonSizes.md}
      ${buttonRounded[rounded] || buttonRounded.md}
    `;

    const combinedClassName = cn(baseClasses, className);

    // Motion props with defaults
    const defaultMotionProps: HTMLMotionProps<'button'> = {
      whileHover: { scale: disabled ? 1 : 1.02 },
      whileTap: { scale: disabled ? 1 : 0.98 },
      transition: { duration: 0.2, ease: 'easeOut' },
    };

    const buttonContent = (
      <>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {children && <span className="ml-2">{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </>
    );

    if (disableMotion) {
      return (
        <button
          ref={ref}
          className={combinedClassName}
          disabled={disabled || isLoading}
          {...props}
        >
          {buttonContent}
        </button>
      );
    }

    // Separate motion props from HTML props
    const allMotionProps = {
      ...defaultMotionProps,
      ...motionProps,
    };

    return (
      <motion.button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...allMotionProps}
        {...props as Omit<ButtonProps, keyof HTMLMotionProps<'button'> | 'variant' | 'size' | 'rounded' | 'isLoading' | 'leftIcon' | 'rightIcon' | 'motionProps' | 'disableMotion'>}
      >
        {buttonContent}
      </motion.button>
    );
  }
);

// Icon Button component (for icon-only buttons)
export interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode;
  ariaLabel: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, ariaLabel, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        aria-label={ariaLabel}
        {...props}
      >
        {icon}
        {children}
      </Button>
    );
  }
);

// Social Button component (for Google, Facebook, etc.)
export interface SocialButtonProps extends ButtonProps {
  provider: 'google' | 'facebook' | 'twitter' | 'github' | 'linkedin';
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  children,
  className = '',
  ...props
}) => {
  const providerIcons: Record<string, React.ReactNode> = {
    google: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    facebook: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
      </svg>
    ),
    twitter: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.223.085 4.934 4.934 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
      </svg>
    ),
    github: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.223.085 4.934 4.934 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
      </svg>
    ),
  };

  const providerClasses = {
    google: 'bg-white border border-border-medium hover:bg-surface-secondary',
    facebook: 'bg-[#1877F2] hover:bg-[#166FE5]',
    twitter: 'bg-[#1DA1F2] hover:bg-[#1A8CD8]',
    github: 'bg-charcoal hover:bg-charcoal-soft',
    linkedin: 'bg-[#0077B5] hover:bg-[#006699]',
  };

  return (
    <Button
      variant="light"
      className={cn(
        `flex items-center justify-center gap-2 ${providerClasses[provider]}`,
        className
      )}
      leftIcon={providerIcons[provider]}
      {...props}
    >
      {children || `Continue with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
    </Button>
  );
};

// Floating Action Button
export const Fab: React.FC<ButtonProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <Button
      className={cn(
        'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg shadow-primary/30',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

// Button Group
export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className = '',
  orientation = 'horizontal',
}) => {
  return (
    <div
      className={cn(
        'flex gap-2',
        orientation === 'vertical' && 'flex-col',
        className
      )}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement, {
            // Add rounded classes based on position
            className: cn(
              child.props.className,
              orientation === 'horizontal' && {
                'rounded-r-none': index < React.Children.count(children) - 1,
                'rounded-l-none': index > 0,
              },
              orientation === 'vertical' && {
                'rounded-b-none': index < React.Children.count(children) - 1,
                'rounded-t-none': index > 0,
              }
            ),
          });
        }
        return child;
      })}
    </div>
  );
};

export default Button;
