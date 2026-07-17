import { createSlice } from '@reduxjs/toolkit'

export interface UiState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
}

const initialState: UiState = {
  sidebarOpen: false,
  sidebarCollapsed: false,
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
    },
  },
})

export const { toggleSidebar, toggleSidebarCollapsed } = uiSlice.actions
export default uiSlice.reducer
