import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface RecentSearch {
  id: string
  query: string
  timestamp: string
  resultCount?: number
}

export interface SearchState {
  isOpen: boolean
  recentSearches: RecentSearch[]
}

function loadRecentSearches(): RecentSearch[] {
  try {
    return JSON.parse(localStorage.getItem('recent_searches') ?? '[]')
  } catch {
    return []
  }
}

const initialState: SearchState = {
  isOpen: false,
  recentSearches: loadRecentSearches(),
}

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    openSearch(state) {
      state.isOpen = true
    },
    closeSearch(state) {
      state.isOpen = false
    },
    toggleSearch(state) {
      state.isOpen = !state.isOpen
    },
    addRecentSearch(state, action: PayloadAction<{ query: string; resultCount?: number }>) {
      const { query, resultCount } = action.payload
      if (!query.trim()) return
      // Remove duplicate
      state.recentSearches = state.recentSearches.filter(
        (s) => s.query.toLowerCase() !== query.toLowerCase()
      )
      state.recentSearches.unshift({
        id: `search_${Date.now()}`,
        query,
        timestamp: new Date().toISOString(),
        resultCount,
      })
      // Keep max 10 recent searches
      state.recentSearches = state.recentSearches.slice(0, 10)
      try {
        localStorage.setItem('recent_searches', JSON.stringify(state.recentSearches))
      } catch {
        // ignore
      }
    },
    removeRecentSearch(state, action: PayloadAction<string>) {
      state.recentSearches = state.recentSearches.filter((s) => s.id !== action.payload)
      localStorage.setItem('recent_searches', JSON.stringify(state.recentSearches))
    },
    clearRecentSearches(state) {
      state.recentSearches = []
      localStorage.removeItem('recent_searches')
    },
  },
})

export const {
  openSearch,
  closeSearch,
  toggleSearch,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} = searchSlice.actions
export default searchSlice.reducer
