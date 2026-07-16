import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { INTEGRATIONS } from '@/config/integrations'

export interface IntegrationsState {
  connected: Record<string, boolean>
}

const stored = localStorage.getItem('integrations_connected')
const storedMap: Record<string, boolean> = stored ? JSON.parse(stored) : {}
// Any integration not present in storage yet defaults to "not connected".
const initialConnected: Record<string, boolean> = Object.fromEntries(
  INTEGRATIONS.map((i) => [i.key, storedMap[i.key] ?? false])
)

const initialState: IntegrationsState = {
  connected: initialConnected,
}

const integrationsSlice = createSlice({
  name: 'integrations',
  initialState,
  reducers: {
    connectIntegration(state, action: PayloadAction<string>) {
      state.connected[action.payload] = true
      localStorage.setItem('integrations_connected', JSON.stringify(state.connected))
    },
    disconnectIntegration(state, action: PayloadAction<string>) {
      state.connected[action.payload] = false
      localStorage.setItem('integrations_connected', JSON.stringify(state.connected))
    },
  },
})

export const { connectIntegration, disconnectIntegration } = integrationsSlice.actions
export default integrationsSlice.reducer
