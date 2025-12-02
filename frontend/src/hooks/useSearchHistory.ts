import { useState, useEffect } from 'react'
import type { SearchHistoryItem } from '@/types/searchHistory.types'
import { useAuth } from '@/context/AuthContext'

const STORAGE_KEY_PREFIX = 'search_history_'
const MAX_SEARCHES = 10

export function useSearchHistory() {
  const { user } = useAuth()
  const [searches, setSearches] = useState<SearchHistoryItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load searches from localStorage on mount and when user changes
  useEffect(() => {
    const storageKey = user?.userId
      ? `${STORAGE_KEY_PREFIX}${user.userId}`
      : null

    if (!storageKey) {
      return
    }

    try {
      const stored = localStorage.getItem(storageKey)
      const parsedSearches: SearchHistoryItem[] = stored
        ? JSON.parse(stored)
        : []

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearches(parsedSearches)
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
    setIsLoaded(true)
  }, [user?.userId])

  // Save searches to localStorage
  const saveSearches = (newSearches: SearchHistoryItem[]) => {
    const storageKey = user?.userId
      ? `${STORAGE_KEY_PREFIX}${user.userId}`
      : null
    if (!storageKey) return

    try {
      localStorage.setItem(storageKey, JSON.stringify(newSearches))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }

  // Add a new search to history
  const addSearch = (search: Omit<SearchHistoryItem, 'id' | 'searchedAt'>) => {
    if (!user?.userId) {
      console.warn('Search history not available for non-authenticated users')
      return
    }

    const newSearch: SearchHistoryItem = {
      ...search,
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      searchedAt: Date.now(),
    }

    // Add to beginning and keep only last MAX_SEARCHES
    const updated = [newSearch, ...searches].slice(0, MAX_SEARCHES)
    setSearches(updated)
    saveSearches(updated)
  }

  // Remove a specific search
  const removeSearch = (id: string) => {
    const updated = searches.filter((s) => s.id !== id)
    setSearches(updated)
    saveSearches(updated)
  }

  // Clear all search history
  const clearHistory = () => {
    setSearches([])
    const storageKey = user?.userId
      ? `${STORAGE_KEY_PREFIX}${user.userId}`
      : null
    if (storageKey) {
      localStorage.removeItem(storageKey)
    }
  }

  return {
    searches,
    addSearch,
    removeSearch,
    clearHistory,
    isLoaded,
    hasHistory: searches.length > 0,
  }
}
