import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type SurveyStatus = 'active' | 'draft' | 'archived'
type TriggerEvent = 'after_appointment' | 'manual' | 'after_x_visits'

export interface SurveyQuestion {
  id: string
  type: 'rating' | 'text' | 'nps' | 'multiple_choice'
  text: string
  required: boolean
  options?: string[]
}

export interface Survey {
  id: string
  name: string
  status: SurveyStatus
  trigger: TriggerEvent
  questions: SurveyQuestion[]
  responseCount: number
  avgRating: number
  createdAt: string
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

interface SurveysState {
  surveys: Survey[]
}

const initialState: SurveysState = {
  surveys: load('surveys_data', []),
}

const surveysSlice = createSlice({
  name: 'surveys',
  initialState,
  reducers: {
    addSurvey(state, action: PayloadAction<Omit<Survey, 'id' | 'createdAt' | 'responseCount' | 'avgRating'>>) {
      const survey: Survey = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split('T')[0],
        responseCount: 0,
        avgRating: 0,
      }
      state.surveys.push(survey)
      save('surveys_data', state.surveys)
    },
    updateSurvey(state, action: PayloadAction<Survey>) {
      const idx = state.surveys.findIndex((s) => s.id === action.payload.id)
      if (idx !== -1) { state.surveys[idx] = action.payload; save('surveys_data', state.surveys) }
    },
    deleteSurvey(state, action: PayloadAction<string>) {
      state.surveys = state.surveys.filter((s) => s.id !== action.payload)
      save('surveys_data', state.surveys)
    },
    changeStatus(state, action: PayloadAction<{ id: string; status: SurveyStatus }>) {
      const s = state.surveys.find((sv) => sv.id === action.payload.id)
      if (s) { s.status = action.payload.status; save('surveys_data', state.surveys) }
    },
  },
})

export const { addSurvey, updateSurvey, deleteSurvey, changeStatus } = surveysSlice.actions
export default surveysSlice.reducer
