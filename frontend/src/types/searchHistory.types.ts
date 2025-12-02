/**
 * Search History Types
 * Defines the structure for storing and managing user search history
 */

export interface SearchHistoryItem {
  id: string
  origin: string
  destination: string
  date: string // ISO date string (YYYY-MM-DD)
  passengers: number
  searchedAt: number // timestamp in milliseconds
}

export interface SearchHistoryContextType {
  searches: SearchHistoryItem[]
  addSearch: (search: Omit<SearchHistoryItem, 'id' | 'searchedAt'>) => void
  removeSearch: (id: string) => void
  clearHistory: () => void
  repeatSearch: (search: SearchHistoryItem) => void
}
