import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AppRole } from '@/types';

const initialState: AuthState = {
  accessToken: null,
  userId: null,
  role: null,
  tenantId: null,
  fullName: null,
  email: null,
  phone: null,
  jobTitle: null,
  avatarUrl: null,
  appRole: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<Partial<AuthState>>) {
      Object.assign(state, action.payload);
    },
    setAppRole(state, action: PayloadAction<AppRole>) {
      state.appRole = action.payload;
    },
    updateProfile(
      state,
      action: PayloadAction<{
        fullName?: string;
        phone?: string;
        jobTitle?: string;
        email?: string;
        avatarUrl?: string;
      }>
    ) {
      Object.assign(state, action.payload);
    },
    logout(state) {
      Object.assign(state, initialState);
    },
  },
});

export const { setCredentials, setAppRole, updateProfile, logout } = authSlice.actions;
export default authSlice.reducer;
