import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthState {
  accessToken: string | null
  userId: string | null
  role: string | null
  fullName: string | null
  email: string | null
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('mgr_access_token'),
  userId: localStorage.getItem('mgr_user_id'),
  role: localStorage.getItem('mgr_role'),
  fullName: localStorage.getItem('mgr_full_name'),
  email: localStorage.getItem('mgr_email'),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<Partial<AuthState>>) {
      const { accessToken, userId, role, fullName, email } = action.payload
      if (accessToken !== undefined) { state.accessToken = accessToken; localStorage.setItem('mgr_access_token', accessToken ?? '') }
      if (userId !== undefined) { state.userId = userId; localStorage.setItem('mgr_user_id', userId ?? '') }
      if (role !== undefined) { state.role = role; localStorage.setItem('mgr_role', role ?? '') }
      if (fullName !== undefined) { state.fullName = fullName; localStorage.setItem('mgr_full_name', fullName ?? '') }
      if (email !== undefined) { state.email = email; localStorage.setItem('mgr_email', email ?? '') }
    },
    logout(state) {
      state.accessToken = null
      state.userId = null
      state.role = null
      state.fullName = null
      state.email = null
      ;['mgr_access_token', 'mgr_user_id', 'mgr_role', 'mgr_full_name', 'mgr_email'].forEach((k) =>
        localStorage.removeItem(k)
      )
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
