import { createSlice } from "@reduxjs/toolkit";

const inboxSlice = createSlice({
  name: "inbox",
  initialState: { unreadCount: 0 },
  reducers: {
    setUnreadCount: (state, action) => {
      state.unreadCount = Math.max(0, action.payload);
    },
    incrementUnread: (state, action) => {
      state.unreadCount += action.payload || 1;
    },
    decrementUnread: (state, action) => {
      state.unreadCount = Math.max(0, state.unreadCount - (action.payload || 1));
    },
  },
});

export const { setUnreadCount, incrementUnread, decrementUnread } = inboxSlice.actions;
export default inboxSlice.reducer;