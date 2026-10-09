import React, { forwardRef, InputHTMLAttributes, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Search, X, ChevronDown, Calendar, Clock } from 'lucide-react';
import { cn } from '../../utils/helpers';

// Input variants
const inputVariants = {
  default: 'bg-surface border border-border-medium focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
  ghost: 'bg-transparent border border-transparent focus:border-primary-500',
  underline: 'bg-transparent border-0 border-b border-border-medium focus:border-b-2 focus:border-primary-500',
  filled: 'bg-surface-secondary border-0 focus:ring-2 focus:ring-primary-500',
};

// Input sizes
const inputSizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3 text-lg',
};

// Input rounded variants
const inputRounded = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

// Interface for input props
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  variant?: keyof typeof inputVariants;
  size?: keyof typeof inputSizes;
  rounded?: keyof typeof inputRounded;
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  type?: InputHTMLAttributes<HTMLInputElement>['type'] | 'select';
  children?: ReactNode;
}

// Main Input component
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      type = 'text',
      variant = 'default',
      size = 'md',
      rounded = 'md',
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      isLoading = false,
      fullWidth = true,
      children,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = `
      w-full outline-none transition-all duration-200
      placeholder:text-muted/60
      disabled:opacity-50 disabled:cursor-not-allowed
      ${inputVariants[variant] || inputVariants.default}
      ${inputSizes[size] || inputSizes.md}
      ${inputRounded[rounded] || inputRounded.md}
    `;

    const combinedClassName = cn(
      baseClasses,
      fullWidth && 'w-full',
      className
    );

    // Toggle password visibility
    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    // Clear input
    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      // This would need to be handled by the parent component
      // as we can't directly modify the value prop
    };

    // Render different input types
    const renderInput = () => {
      const inputType = type === 'password' && showPassword ? 'text' : type;
      
      return (
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input Element */}
          {type === 'select' ? (
            <select
              id={inputId}
              disabled={disabled || isLoading}
              className={combinedClassName}
              aria-invalid={!!error}
              aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
              {...props}
            >
              {children}
            </select>
          ) : (
            <input
              ref={ref}
              id={inputId}
              type={inputType}
              disabled={disabled || isLoading}
              className={cn(
                combinedClassName,
                (leftIcon || rightIcon) && 'pl-10',
                rightIcon && 'pr-10'
              )}
              aria-invalid={!!error}
              aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
              {...props}
            />
          )}

          {/* Right Icon / Actions */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              {rightIcon}
            </div>
          )}

          {/* Password Toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary-500 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Clear Button */}
          {type === 'search' && props.value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary-500 transition-colors"
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-sm font-medium text-primary"
          >
            {label}
          </label>
        )}

        {/* Input */}
        {renderInput()}

        {/* Hint */}
        {hint && !error && (
          <p className="mt-2 text-xs text-muted/70">{hint}</p>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 text-xs text-error"
              id={`${inputId}-error`}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

// Search Input
export interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon' | 'rightIcon'> {
  onSearch?: (value: string) => void;
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  onClear,
  value,
  ...props
}) => {
  const [localValue, setLocalValue] = useState<string>(value ? String(value) : '');
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(localValue);
    }
  };

  return (
    <Input
      type="search"
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      leftIcon={<Search className="w-5 h-5" />}
      rightIcon={localValue && (
        <button
          type="button"
          onClick={() => {
            setLocalValue('');
            onClear?.();
          }}
          className="text-muted hover:text-primary-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      placeholder="Search..."
      className={cn(
        'w-full',
        isFocused && 'ring-2 ring-primary-500 border-primary-500'
      )}
      {...props}
    />
  );
};

// Textarea component
export interface TextareaProps extends Omit<InputHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  variant?: keyof typeof inputVariants;
  size?: keyof typeof inputSizes;
  rounded?: keyof typeof inputRounded;
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      rounded = 'md',
      label,
      hint,
      error,
      fullWidth = true,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const inputId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = `
      w-full outline-none transition-all duration-200
      placeholder:text-muted/60
      resize-vertical
      ${inputVariants[variant] || inputVariants.default}
      ${inputSizes[size] || inputSizes.md}
      ${inputRounded[rounded] || inputRounded.md}
    `;

    const combinedClassName = cn(
      baseClasses,
      fullWidth && 'w-full',
      className
    );

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-sm font-medium text-primary"
          >
            {label}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={combinedClassName}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />

        {/* Hint */}
        {hint && !error && (
          <p className="mt-2 text-xs text-muted/70">{hint}</p>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 text-xs text-error"
              id={`${inputId}-error`}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

// Select component
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: keyof typeof inputVariants;
  size?: keyof typeof inputSizes;
  rounded?: keyof typeof inputRounded;
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      rounded = 'md',
      label,
      hint,
      error,
      options = [],
      fullWidth = true,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = `
      w-full outline-none transition-all duration-200
      appearance-none bg-transparent
      placeholder:text-muted/60
      ${inputVariants[variant] || inputVariants.default}
      ${inputSizes[size] || inputSizes.md}
      ${inputRounded[rounded] || inputRounded.md}
    `;

    const combinedClassName = cn(
      baseClasses,
      fullWidth && 'w-full',
      className
    );

    return (
      <div className="w-full relative">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-sm font-medium text-primary"
          >
            {label}
          </label>
        )}

        {/* Select */}
        <select
          ref={ref}
          id={inputId}
          className={combinedClassName}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        >
          {props.placeholder && (
            <option value="" disabled selected>
              {props.placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted">
          <ChevronDown className="w-5 h-5" />
        </div>

        {/* Hint */}
        {hint && !error && (
          <p className="mt-2 text-xs text-muted/70">{hint}</p>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 text-xs text-error"
              id={`${inputId}-error`}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

// File Input
export interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: keyof typeof inputVariants;
  size?: keyof typeof inputSizes;
  rounded?: keyof typeof inputRounded;
  label?: string;
  hint?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  onFileChange?: (files: FileList | null) => void;
}

export const FileInput: React.FC<FileInputProps> = ({
  variant = 'default',
  size = 'md',
  rounded = 'md',
  label,
  hint,
  error,
  accept,
  multiple = false,
  onFileChange,
  ...props
}) => {
  const inputId = props.id || `file-${Math.random().toString(36).substr(2, 9)}`;
  const [fileName, setFileName] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (multiple) {
        setFileName(`${e.target.files.length} files selected`);
      } else {
        setFileName(e.target.files[0].name);
      }
    } else {
      setFileName('');
    }
    
    if (onFileChange) {
      onFileChange(e.target.files);
    }
    
    if (props.onChange) {
      props.onChange(e);
    }
  };

  const baseClasses = `
    w-full outline-none transition-all duration-200
    placeholder:text-muted/60
    ${inputVariants[variant] || inputVariants.default}
    ${inputSizes[size] || inputSizes.md}
    ${inputRounded[rounded] || inputRounded.md}
  `;

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-2 text-sm font-medium text-primary"
        >
          {label}
        </label>
      )}

      {/* File Input */}
      <div className="relative">
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          {...props}
        />
        <div className={cn(
          baseClasses,
          'flex items-center justify-between cursor-pointer pr-10',
          !fileName && 'text-muted/60'
        )}>
          {fileName || props.placeholder || 'Choose a file'}
        </div>
      </div>

      {/* Hint */}
      {hint && !error && (
        <p className="mt-2 text-xs text-muted/70">{hint}</p>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 text-xs text-error"
            id={`${inputId}-error`}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Input;
