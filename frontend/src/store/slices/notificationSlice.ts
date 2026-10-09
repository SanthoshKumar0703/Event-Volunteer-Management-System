import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationState {
  notifications: any[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<any[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.read).length;
      state.loading = false;
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<any>) => {
      state.notifications.push(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
      state.loading = false;
      state.error = null;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n._id === action.payload);
      if (notification) {
        notification.read = true;
        state.unreadCount -= 1;
      }
      state.loading = false;
      state.error = null;
    },
    setNotificationsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setNotificationsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setNotifications, addNotification, markAsRead, setNotificationsLoading, setNotificationsError } = notificationSlice.actions;
export default notificationSlice.reducer;
