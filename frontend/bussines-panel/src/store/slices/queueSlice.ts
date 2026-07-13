import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type QueueStatus = 'waiting' | 'called' | 'serving' | 'done' | 'cancelled'

export interface QueueEntry {
  id: string
  ticketNo: number
  name: string
  service: string
  phone: string
  email?: string
  addedAt: string // ISO string for serialization
  calledAt?: string
  status: QueueStatus
  estimatedWait: number
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

interface QueueState {
  queue: QueueEntry[]
  nextTicketNo: number
}

const initialState: QueueState = {
  queue: load('walkin_queue', []),
  nextTicketNo: load('walkin_ticket_no', 101),
}

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    addToQueue(state, action: PayloadAction<Pick<QueueEntry, 'name' | 'service' | 'phone' | 'email' | 'estimatedWait'>>) {
      const entry: QueueEntry = {
        ...action.payload,
        id: Date.now().toString(),
        ticketNo: state.nextTicketNo,
        addedAt: new Date().toISOString(),
        status: 'waiting',
      }
      state.queue.push(entry)
      state.nextTicketNo += 1
      save('walkin_queue', state.queue)
      save('walkin_ticket_no', state.nextTicketNo)
    },
    updateStatus(state, action: PayloadAction<{ id: string; status: QueueStatus }>) {
      const entry = state.queue.find((e) => e.id === action.payload.id)
      if (entry) {
        entry.status = action.payload.status
        if (action.payload.status === 'called') entry.calledAt = new Date().toISOString()
        save('walkin_queue', state.queue)
      }
    },
    removeEntry(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((e) => e.id !== action.payload)
      save('walkin_queue', state.queue)
    },
    clearCompleted(state) {
      state.queue = state.queue.filter((e) => e.status !== 'done' && e.status !== 'cancelled')
      save('walkin_queue', state.queue)
    },
  },
})

export const { addToQueue, updateStatus, removeEntry, clearCompleted } = queueSlice.actions
export default queueSlice.reducer
