// ============================================
// COMMON UTILITY TYPES
// ============================================

import { ReactNode } from 'react';
import { ObjectId } from 'mongodb';

// Generic Types
export type ValueOf<T> = T[keyof T];
export type KeyOf<T> = keyof T;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ID Types
export type ID = string | ObjectId;
export type IDString = string;
export type IDObject = ObjectId;

// Status Types
export type Status = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'DELETED';
export type Visibility = 'PUBLIC' | 'PRIVATE' | 'HIDDEN' | 'ARCHIVED';

// Date Types
export type DateString = string;
export type DateObject = Date;
export type DateRange = {
  start: Date | string;
  end: Date | string;
};

export type TimeRange = {
  start: string; // HH:mm
  end: string; // HH:mm
};

// Pagination Types
export interface PageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PageInfo;
}

// Sort Types
export interface SortOptions<T> {
  sortBy: keyof T;
  sortOrder: 'ASC' | 'DESC';
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Filter Types
export interface FilterOptions {
  [key: string]: any;
}

export interface FilterParams extends SortParams, PageInfo {
  [key: string]: any;
}

// Table Types
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => ReactNode;
  className?: string;
}

export interface TableConfig<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  onSort?: (sortBy: keyof T, sortOrder: 'ASC' | 'DESC') => void;
  sortBy?: keyof T;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
  total?: number;
  isLoading?: boolean;
  emptyMessage?: string;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'file' | 'switch';
  placeholder?: string;
  value?: any;
  defaultValue?: any;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  options?: { value: any; label: string }[];
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    message?: string;
  };
  helpText?: string;
  error?: string;
  className?: string;
  rows?: number; // for textarea
  multiple?: boolean; // for select
}

export interface FormConfig {
  fields: FormField[];
  initialValues: Record<string, any>;
  validationSchema?: any;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onChange?: (name: string, value: any) => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

// UI State Types
export interface UIState {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error?: string;
  message?: string;
}

export interface AsyncState<T> extends UIState {
  data?: T;
}

// Modal Types
export interface ModalConfig {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

// Toast Types
export interface ToastConfig {
  id?: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'default';
  duration?: number; // in ms
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  progressBar?: boolean;
}

// Confirmation Dialog Types
export interface ConfirmDialogConfig {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'secondary';
  cancelVariant?: 'ghost' | 'secondary';
  isLoading?: boolean;
  icon?: ReactNode;
}

// Dropdown Types
export interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'danger' | 'success' | 'warning';
}

export interface DropdownConfig {
  items: DropdownItem[];
  onSelect?: (item: DropdownItem) => void;
  trigger?: ReactNode;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'right-start' | 'right-end' | 'left-start' | 'left-end';
  disabled?: boolean;
  className?: string;
}

// Tab Types
export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
  disabled?: boolean;
  content?: ReactNode;
}

export interface TabConfig {
  items: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'pills' | 'underline' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Breadcrumb Types
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface BreadcrumbConfig {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: (number | null)[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointBackgroundColor?: string | string[];
  pointBorderColor?: string | string[];
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polar' | 'area';
  data: ChartData;
  options?: any;
  height?: number;
  width?: number;
  className?: string;
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  allDay?: boolean;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  description?: string;
  location?: string;
  status?: string;
  onClick?: () => void;
}

export interface CalendarConfig {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  view?: 'month' | 'week' | 'day' | 'agenda';
  date?: Date;
  onNavigate?: (date: Date) => void;
  className?: string;
}

// Drag and Drop Types
export interface DraggableItem {
  id: string;
  index: number;
  [key: string]: any;
}

export interface DroppableContainer {
  id: string;
  items: DraggableItem[];
  [key: string]: any;
}

export interface DragDropConfig<T> {
  items: T[];
  onDragEnd: (result: { source: { index: number; droppableId: string }; destination: { index: number; droppableId: string } }) => void;
  droppableId: string;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  disabled?: boolean;
  className?: string;
}

// File Types
export interface FileInfo {
  id?: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  preview?: string;
  lastModified?: number;
}

export interface FileUploadConfig {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onUpload?: (files: File[]) => void;
  onRemove?: (file: FileInfo) => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

// Color Types
export interface Color {
  hex: string;
  rgb: string;
  hsl: string;
  name?: string;
}

// Theme Types
export type ThemeMode = 'LIGHT' | 'DARK' | 'SYSTEM';

export interface ThemeConfig {
  mode: ThemeMode;
  primary?: string;
  secondary?: string;
  accent?: string;
}

// Animation Types
export type AnimationPreset = 
  | 'fade'
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeLeft'
  | 'fadeRight'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scale'
  | 'scaleUp'
  | 'scaleDown'
  | 'bounce'
  | 'spin'
  | 'pulse'
  | 'shake'
  | 'float';

export interface AnimationConfig {
  preset?: AnimationPreset;
  type?: 'enter' | 'exit' | 'whileHover' | 'whileTap' | 'whileInView';
  duration?: number; // in ms
  delay?: number; // in ms
  ease?: 'easeIn' | 'easeOut' | 'easeInOut' | 'linear' | string;
  stiffness?: number;
  damping?: number;
  mass?: number;
  children?: AnimationConfig;
}

// Responsive Types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ResponsiveValue<T> = {
  [K in Breakpoint]?: T;
};

export interface ResponsiveConfig {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
}

// Internationalization Types
export interface Translation {
  [key: string]: string;
}

export interface Translations {
  [lang: string]: Translation;
}

export interface I18nConfig {
  defaultLocale: string;
  locales: string[];
  translations: Translations;
  fallback?: string;
}

// Accessibility Types
export interface A11yConfig {
  label?: string;
  describedBy?: string;
  liveRegion?: 'polite' | 'assertive';
  role?: string;
  tabIndex?: number;
  disabled?: boolean;
  hidden?: boolean;
  aria?: Record<string, string>;
}

// Analytics Types
export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  data?: Record<string, any>;
  timestamp?: number;
}

export interface AnalyticsConfig {
  trackingId?: string;
  onEvent?: (event: AnalyticsEvent) => void;
  disabled?: boolean;
}

// Error Types
export interface AppError extends Error {
  code?: string;
  status?: number;
  details?: any;
  isFatal?: boolean;
  isRetryable?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
  errorInfo?: {
    componentStack: string;
  };
}

// Loading Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingConfig {
  state: LoadingState;
  message?: string;
  error?: string;
  retry?: () => void;
}

// Empty State Types
export interface EmptyStateConfig {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  className?: string;
}

// Pagination Types
export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  showFirstLast?: boolean;
  className?: string;
}

// Search Types
export interface SearchConfig {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  debounce?: number; // in ms
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

// Filter Types
export interface FilterOption {
  value: string | number | boolean;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface FilterConfig {
  label: string;
  key: string;
  type: 'select' | 'multiselect' | 'checkbox' | 'radio' | 'range' | 'date' | 'search';
  options?: FilterOption[];
  value?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  className?: string;
}
