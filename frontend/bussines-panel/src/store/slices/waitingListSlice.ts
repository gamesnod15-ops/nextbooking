import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type WaitStatus = 'waiting' | 'notified' | 'confirmed' | 'cancelled' | 'booked'

export interface WaitingEntry {
  id: string
  name: string
  phone: string
  email?: string
  serviceId: string
  serviceName: string
  preferredDate: string
  preferredTimeFrom: string
  preferredTimeTo: string
  addedAt: string
  status: WaitStatus
  notificationSent: boolean
  notes?: string
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* ignore */ }
}

interface WaitingListState {
  list: WaitingEntry[]
}

const initialState: WaitingListState = {
  list: load('waiting_list', []),
}

const waitingListSlice = createSlice({
  name: 'waitingList',
  initialState,
  reducers: {
    addEntry(state, action: PayloadAction<Omit<WaitingEntry, 'id' | 'addedAt' | 'status' | 'notificationSent'>>) {
      const entry: WaitingEntry = {
        ...action.payload,
        id: Date.now().toString(),
        addedAt: new Date().toISOString().split('T')[0],
        status: 'waiting',
        notificationSent: false,
      }
      state.list.push(entry)
      save('waiting_list', state.list)
    },
    updateStatus(state, action: PayloadAction<{ id: string; status: WaitStatus }>) {
      const entry = state.list.find((e) => e.id === action.payload.id)
      if (entry) { entry.status = action.payload.status; save('waiting_list', state.list) }
    },
    markNotified(state, action: PayloadAction<string>) {
      const entry = state.list.find((e) => e.id === action.payload)
      if (entry) { entry.notificationSent = true; entry.status = 'notified'; save('waiting_list', state.list) }
    },
    deleteEntry(state, action: PayloadAction<string>) {
      state.list = state.list.filter((e) => e.id !== action.payload)
      save('waiting_list', state.list)
    },
  },
})

export const { addEntry, updateStatus, markNotified, deleteEntry } = waitingListSlice.actions
export default waitingListSlice.reducer
