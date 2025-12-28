import type { SearchHistoryItem } from '@/types/searchHistory.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, RotateCw, Clock, Trash, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SearchHistoryPanelProps {
  searches: SearchHistoryItem[]
  onSelectSearch: (search: SearchHistoryItem) => void
  onRemoveSearch: (id: string) => void
  onClearHistory: () => void
  isLoading?: boolean
}

export function SearchHistoryPanel({
  searches,
  onSelectSearch,
  onRemoveSearch,
  onClearHistory,
  isLoading = false,
}: SearchHistoryPanelProps) {
  if (searches.length === 0) {
    return null
  }

  // Sort by most recent first
  const sortedSearches = [...searches].sort(
    (a, b) => b.searchedAt - a.searchedAt
  )

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Recent Searches</CardTitle>
            {sortedSearches.length > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                ({sortedSearches.length})
              </span>
            )}
          </div>
          {sortedSearches.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearHistory}
              disabled={isLoading}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedSearches.map((search) => (
            <div
              key={search.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
            >
              <button
                onClick={() => onSelectSearch(search)}
                disabled={isLoading}
                className="flex-1 text-left transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <span className="text-foreground">{search.origin}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">
                      {search.destination}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(search.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {search.passengers > 1 && (
                      <>
                        <span>•</span>
                        <span>
                          {search.passengers} passenger
                          {search.passengers > 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(search.searchedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectSearch(search)}
                  disabled={isLoading}
                  title="Repeat this search"
                  className="h-8 w-8 p-0"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSearch(search.id)}
                  disabled={isLoading}
                  title="Remove from history"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
