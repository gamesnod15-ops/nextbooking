import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import businessReducer from './slices/businessSlice'
import notificationsReducer from './slices/notificationsSlice'
import modulesReducer from './slices/modulesSlice'
import errorReducer from './slices/errorSlice'
import searchReducer from './slices/searchSlice'
import queueReducer from './slices/queueSlice'
import waitingListReducer from './slices/waitingListSlice'
import surveysReducer from './slices/surveysSlice'
import socialMediaReducer from './slices/socialMediaSlice'
import whatsappBotReducer from './slices/whatsappBotSlice'
import integrationsReducer from './slices/integrationsSlice'
import type { AuthState } from './slices/authSlice'
import type { UiState } from './slices/uiSlice'
import type { BusinessState } from './slices/businessSlice'
import type { NotificationsState } from './slices/notificationsSlice'
import type { ModulesState } from './slices/modulesSlice'
import type { ErrorState } from './slices/errorSlice'
import type { SearchState } from './slices/searchSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    business: businessReducer,
    notifications: notificationsReducer,
    modules: modulesReducer,
    errors: errorReducer,
    search: searchReducer,
    queue: queueReducer,
    waitingList: waitingListReducer,
    surveys: surveysReducer,
    socialMedia: socialMediaReducer,
    whatsappBot: whatsappBotReducer,
    integrations: integrationsReducer,
  },
})

export interface RootState {
  auth: AuthState
  ui: UiState
  business: BusinessState
  notifications: NotificationsState
  modules: ModulesState
  errors: ErrorState
  search: SearchState
  queue: ReturnType<typeof queueReducer>
  waitingList: ReturnType<typeof waitingListReducer>
  surveys: ReturnType<typeof surveysReducer>
  socialMedia: ReturnType<typeof socialMediaReducer>
  whatsappBot: ReturnType<typeof whatsappBotReducer>
  integrations: ReturnType<typeof integrationsReducer>
}
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
