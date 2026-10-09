import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EventState {
  events: any[];
  loading: boolean;
  error: string | null;
}

const initialState: EventState = {
  events: [],
  loading: false,
  error: null,
};

export const eventSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<any[]>) => {
      state.events = action.payload;
      state.loading = false;
      state.error = null;
    },
    addEvent: (state, action: PayloadAction<any>) => {
      state.events.push(action.payload);
      state.loading = false;
      state.error = null;
    },
    updateEvent: (state, action: PayloadAction<any>) => {
      const index = state.events.findIndex(e => e._id === action.payload._id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
      state.loading = false;
      state.error = null;
    },
    setEventsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setEventsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setEvents, addEvent, updateEvent, setEventsLoading, setEventsError } = eventSlice.actions;
export default eventSlice.reducer;
