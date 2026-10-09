import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';

// Import reducers
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import eventReducer from './slices/eventSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';

// Configure store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    events: eventReducer,
    notifications: notificationReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'], // Ignore redux-persist actions
      },
    }),
  devTools: import.meta.env.DEV,
});

// Infer types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// Custom hook for typed useDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Export store
export default store;
