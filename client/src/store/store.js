import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import inboxReducer from "./inboxSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    inbox: inboxReducer,
  },
});