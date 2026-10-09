import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  currentTheme: 'light' | 'dark' | 'system';
  isLoading: boolean;
  loadingMessage: string | null;
  error: string | null;
  toastMessages: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    title?: string;
  }>;
}

const initialState: UIState = {
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  currentTheme: 'system',
  isLoading: false,
  loadingMessage: null,
  error: null,
  toastMessages: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.isSidebarOpen = action.payload;
    },
    
    // Mobile menu
    toggleMobileMenu(state) {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    setMobileMenuOpen(state, action: PayloadAction<boolean>) {
      state.isMobileMenuOpen = action.payload;
    },
    
    // Theme
    setTheme(state, action: PayloadAction<'light' | 'dark' | 'system'>) {
      state.currentTheme = action.payload;
    },
    
    // Loading
    showLoading(state, action: PayloadAction<{ message?: string }>) {
      state.isLoading = true;
      state.loadingMessage = action.payload.message || null;
    },
    hideLoading(state) {
      state.isLoading = false;
      state.loadingMessage = null;
    },
    
    // Error
    showError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    
    // Toast
    addToast(state, action: PayloadAction<{
      id: string;
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
      title?: string;
    }>) {
      state.toastMessages.push(action.payload);
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toastMessages = state.toastMessages.filter(
        toast => toast.id !== action.payload
      );
    },
    clearToasts(state) {
      state.toastMessages = [];
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  setTheme,
  showLoading,
  hideLoading,
  showError,
  clearError,
  addToast,
  removeToast,
  clearToasts,
} = uiSlice.actions;

export default uiSlice.reducer;
