/* eslint-disable @typescript-eslint/camelcase */
import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import settingsSlice from "../slices/settingsSlice";
import appSettingsSlice from "../slices/appSettingsSlice";
import rendererSlice from "../slices/rendererSlice";
import loginSlice from "../slices/loginSlice";
import overlaySlice from "../slices/overlaySlice";

const rootReducer = combineReducers({
  settings: settingsSlice.reducer,
  appsettings: appSettingsSlice.reducer,
  renderer: rendererSlice.reducer,
  login: loginSlice.reducer,
  overlay: overlaySlice.reducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: [],
});

export default store;
type _AppState = ReturnType<typeof rootReducer>;
