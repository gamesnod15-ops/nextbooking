import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UiState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
}

const initialState: UiState = {
  sidebarOpen: false,
  sidebarCollapsed: localStorage.getItem('sidebar_collapsed') === 'true',
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    toggleSidebarCollapsed(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
      localStorage.setItem('sidebar_collapsed', String(state.sidebarCollapsed))
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
    },
  },
})

export const { toggleSidebar, toggleSidebarCollapsed, setTheme } = uiSlice.actions
export default uiSlice.reducer
