import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthState {
  accessToken: string | null
  userId: string | null
  role: string | null
  tenantId: string | null
  fullName: string | null
  email: string | null
  phone: string | null
  jobTitle: string | null
  avatarUrl: string | null
  /**
   * True when this session's credentials came from the ?autologin= handoff
   * from the web app, not a real login against this app's own origin. The
   * refresh-token cookie is scoped to whichever origin actually performed
   * the login — an autologin session never received one here, so attempting
   * a refresh is guaranteed to 401. See api.ts's response interceptor.
   */
  viaAutologin: boolean
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('access_token'),
  userId: localStorage.getItem('user_id'),
  role: localStorage.getItem('role'),
  tenantId: localStorage.getItem('tenant_id'),
  fullName: localStorage.getItem('full_name'),
  email: localStorage.getItem('profile_email'),
  phone: localStorage.getItem('profile_phone'),
  jobTitle: localStorage.getItem('profile_job_title'),
  avatarUrl: localStorage.getItem('profile_avatar'),
  viaAutologin: localStorage.getItem('via_autologin') === '1',
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<Partial<AuthState>>) {
      const { accessToken, userId, role, tenantId, fullName, email, phone, jobTitle, avatarUrl, viaAutologin } = action.payload
      if (accessToken !== undefined) { state.accessToken = accessToken; localStorage.setItem('access_token', accessToken ?? '') }
      if (userId !== undefined) { state.userId = userId; localStorage.setItem('user_id', userId ?? '') }
      if (role !== undefined) { state.role = role; localStorage.setItem('role', role ?? '') }
      if (tenantId !== undefined) { state.tenantId = tenantId; localStorage.setItem('tenant_id', tenantId ?? '') }
      if (fullName !== undefined) { state.fullName = fullName; localStorage.setItem('full_name', fullName ?? '') }
      if (email !== undefined) { state.email = email; localStorage.setItem('profile_email', email ?? '') }
      if (phone !== undefined) { state.phone = phone; localStorage.setItem('profile_phone', phone ?? '') }
      if (jobTitle !== undefined) { state.jobTitle = jobTitle; localStorage.setItem('profile_job_title', jobTitle ?? '') }
      if (avatarUrl !== undefined) { state.avatarUrl = avatarUrl; localStorage.setItem('profile_avatar', avatarUrl ?? '') }
      if (viaAutologin !== undefined) { state.viaAutologin = viaAutologin; localStorage.setItem('via_autologin', viaAutologin ? '1' : '0') }
    },
    updateProfile(state, action: PayloadAction<{ fullName?: string; phone?: string; jobTitle?: string; email?: string; avatarUrl?: string }>) {
      const { fullName, phone, jobTitle, email, avatarUrl } = action.payload
      if (fullName !== undefined) { state.fullName = fullName; localStorage.setItem('full_name', fullName) }
      if (phone !== undefined) { state.phone = phone; localStorage.setItem('profile_phone', phone) }
      if (jobTitle !== undefined) { state.jobTitle = jobTitle; localStorage.setItem('profile_job_title', jobTitle) }
      if (email !== undefined) { state.email = email; localStorage.setItem('profile_email', email) }
      if (avatarUrl !== undefined) { state.avatarUrl = avatarUrl; localStorage.setItem('profile_avatar', avatarUrl) }
    },
    logout(state) {
      state.accessToken = null
      state.userId = null
      state.role = null
      state.tenantId = null
      state.fullName = null
      state.email = null
      state.phone = null
      state.jobTitle = null
      state.avatarUrl = null
      state.viaAutologin = false
      const authKeys = [
        'access_token', 'user_id', 'role', 'tenant_id',
        'full_name', 'profile_email', 'profile_phone',
        'profile_job_title', 'profile_avatar', 'via_autologin',
      ]
      authKeys.forEach(k => localStorage.removeItem(k))
    },
  },
})

export const { setCredentials, updateProfile, logout } = authSlice.actions
export default authSlice.reducer
