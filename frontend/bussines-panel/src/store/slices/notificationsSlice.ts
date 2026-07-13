import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Notification } from '@/types'

export interface NotificationsState {
  items: Notification[]
  unreadCount: number
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload)
      if (!action.payload.isRead) state.unreadCount++
    },
    markAsRead(state, action: PayloadAction<string>) {
      const notification = state.items.find((n) => n.id === action.payload)
      if (notification && !notification.isRead) {
        notification.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllAsRead(state) {
      state.items.forEach((n) => (n.isRead = true))
      state.unreadCount = 0
    },
    clearNotification(state, action: PayloadAction<string>) {
      const idx = state.items.findIndex((n) => n.id === action.payload)
      if (idx !== -1) {
        if (!state.items[idx].isRead) state.unreadCount = Math.max(0, state.unreadCount - 1)
        state.items.splice(idx, 1)
      }
    },
  },
})

export const { addNotification, markAsRead, markAllAsRead, clearNotification } =
  notificationsSlice.actions
export default notificationsSlice.reducer
