import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type ErrorSeverity = 'warning' | 'error' | 'critical'
export type ErrorCategory = 'api' | 'runtime' | 'network' | 'auth' | 'validation' | 'unknown'

export interface AppError {
  id: string
  code: string
  message: string
  description?: string
  page: string
  url: string
  route: string
  timestamp: string
  userId: string | null
  userFullName: string | null
  browser: string
  platform: string
  apiEndpoint?: string
  statusCode?: number
  stackTrace?: string
  severity: ErrorSeverity
  category: ErrorCategory
  sessionId: string
  requestId?: string
  resolved: boolean
}

export interface ErrorState {
  errors: AppError[]
  totalCount: number
  unresolvedCount: number
  sessionId: string
}

function generateSessionId() {
  const existing = sessionStorage.getItem('error_session_id')
  if (existing) return existing
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  sessionStorage.setItem('error_session_id', id)
  return id
}

const initialState: ErrorState = {
  errors: JSON.parse(localStorage.getItem('error_log') ?? '[]'),
  totalCount: 0,
  unresolvedCount: 0,
  sessionId: generateSessionId(),
}

initialState.totalCount = initialState.errors.length
initialState.unresolvedCount = initialState.errors.filter((e) => !e.resolved).length

const errorSlice = createSlice({
  name: 'errors',
  initialState,
  reducers: {
    addError(state, action: PayloadAction<Omit<AppError, 'id' | 'resolved' | 'sessionId'>>) {
      const error: AppError = {
        ...action.payload,
        id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        resolved: false,
        sessionId: state.sessionId,
      }
      state.errors.unshift(error)
      // Keep max 200 errors in memory/storage
      if (state.errors.length > 200) state.errors = state.errors.slice(0, 200)
      state.totalCount = state.errors.length
      state.unresolvedCount = state.errors.filter((e) => !e.resolved).length
      try {
        localStorage.setItem('error_log', JSON.stringify(state.errors.slice(0, 50)))
      } catch {
        // ignore storage errors
      }
    },
    resolveError(state, action: PayloadAction<string>) {
      const err = state.errors.find((e) => e.id === action.payload)
      if (err) {
        err.resolved = true
        state.unresolvedCount = Math.max(0, state.unresolvedCount - 1)
      }
    },
    resolveAllErrors(state) {
      state.errors.forEach((e) => (e.resolved = true))
      state.unresolvedCount = 0
    },
    deleteError(state, action: PayloadAction<string>) {
      const idx = state.errors.findIndex((e) => e.id === action.payload)
      if (idx !== -1) {
        if (!state.errors[idx].resolved) state.unresolvedCount = Math.max(0, state.unresolvedCount - 1)
        state.errors.splice(idx, 1)
        state.totalCount = state.errors.length
      }
    },
    clearAllErrors(state) {
      state.errors = []
      state.totalCount = 0
      state.unresolvedCount = 0
      localStorage.removeItem('error_log')
    },
  },
})

export const { addError, resolveError, resolveAllErrors, deleteError, clearAllErrors } =
  errorSlice.actions
export default errorSlice.reducer
