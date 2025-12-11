import { useState, useEffect, useCallback } from 'react'
import type { SearchHistoryItem } from '@/types/searchHistory.types'
import { useAuth } from '@/context/AuthContext'

const STORAGE_KEY_PREFIX = 'search_history_'
const MAX_SEARCHES = 5

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

  // Add a new search to history
  const addSearch = useCallback(
    (search: Omit<SearchHistoryItem, 'id' | 'searchedAt'>) => {
      if (!user?.userId) {
        console.warn('Search history not available for non-authenticated users')
        return
      }

      const storageKey = `${STORAGE_KEY_PREFIX}${user.userId}`
      const stored = localStorage.getItem(storageKey)
      const currentSearches: SearchHistoryItem[] = stored
        ? JSON.parse(stored)
        : []

      // Remove any existing search with the same parameters
      const filteredSearches = currentSearches.filter(
        (s) =>
          !(
            s.origin === search.origin &&
            s.destination === search.destination &&
            s.date === search.date &&
            s.passengers === search.passengers
          )
      )

      const newSearch: SearchHistoryItem = {
        ...search,
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        searchedAt: Date.now(),
      }

      const updated = [newSearch, ...filteredSearches].slice(0, MAX_SEARCHES)
      setSearches(updated)
      localStorage.setItem(storageKey, JSON.stringify(updated))
    },
    [user]
  )

  // Remove a specific search
  const removeSearch = useCallback(
    (id: string) => {
      if (!user?.userId) return
      const storageKey = `${STORAGE_KEY_PREFIX}${user.userId}`
      const stored = localStorage.getItem(storageKey)
      const currentSearches: SearchHistoryItem[] = stored
        ? JSON.parse(stored)
        : []
      const updated = currentSearches.filter((s) => s.id !== id)
      setSearches(updated)
      localStorage.setItem(storageKey, JSON.stringify(updated))
    },
    [user]
  )

  // Clear all search history
  const clearHistory = useCallback(() => {
    if (!user?.userId) return
    setSearches([])
    const storageKey = `${STORAGE_KEY_PREFIX}${user.userId}`
    localStorage.removeItem(storageKey)
  }, [user])

  return {
    searches,
    addSearch,
    removeSearch,
    clearHistory,
    isLoaded,
    hasHistory: searches.length > 0,
  }
}
