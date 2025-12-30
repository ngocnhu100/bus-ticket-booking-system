import React, { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { request as apiRequest, getAccessToken } from '../../api/auth'

interface FeedbackStats {
  total_feedback: number
  positive_count: number
  negative_count: number
  with_comment_count: number
  positive_percentage: number
}

interface Feedback {
  feedback_id: number
  session_id: string
  message_id: string
  rating: 'positive' | 'negative'
  comment: string | null
  created_at: string
  message_content: string
  user_id: string | null
}

interface TrendData {
  date: string
  total: number
  positive: number
  negative: number
}

export const ChatbotFeedbackDashboard: React.FC = () => {
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([])
  const [negativeFeedback, setNegativeFeedback] = useState<Feedback[]>([])
  const [commentFeedback, setCommentFeedback] = useState<Feedback[]>([])
  const [trend, setTrend] = useState<TrendData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = getAccessToken()

      // Fetch stats
      const statsResponse = await apiRequest('/chatbot/admin/feedback/stats', {
        method: 'GET',
        token: token || undefined,
      })
      if (statsResponse.success) {
        setStats(statsResponse.data)
      }

      // Fetch recent feedback
      const recentResponse = await apiRequest(
        '/chatbot/admin/feedback/recent?limit=20',
        {
          method: 'GET',
          token: token || undefined,
        }
      )
      if (recentResponse.success) {
        setRecentFeedback(recentResponse.data.feedback)
      }

      // Fetch negative feedback
      const negativeResponse = await apiRequest(
        '/chatbot/admin/feedback/negative?limit=20',
        {
          method: 'GET',
          token: token || undefined,
        }
      )
      if (negativeResponse.success) {
        setNegativeFeedback(negativeResponse.data.feedback)
      }

      // Fetch feedback with comments
      const commentsResponse = await apiRequest(
        '/chatbot/admin/feedback/comments?limit=20',
        {
          method: 'GET',
          token: token || undefined,
        }
      )
      if (commentsResponse.success) {
        setCommentFeedback(commentsResponse.data.feedback)
      }

      // Fetch trend
      const trendResponse = await apiRequest(
        '/chatbot/admin/feedback/trend?days=30',
        {
          method: 'GET',
          token: token || undefined,
        }
      )
      if (trendResponse.success) {
        setTrend(trendResponse.data.trend)
      }
    } catch (err) {
      console.error('[ChatbotFeedbackDashboard] Error fetching data:', err)
      setError('Failed to load feedback data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading feedback data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_feedback}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time feedback received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                Positive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.positive_count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.positive_percentage}% positive rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-red-600" />
                Negative
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.negative_count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(100 - stats.positive_percentage).toFixed(2)}% negative rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                With Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.with_comment_count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Detailed feedback provided
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="negative">Negative Feedback</TabsTrigger>
          <TabsTrigger value="comments">With Comments</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Latest feedback from users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFeedback.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No feedback yet
                  </p>
                ) : (
                  recentFeedback.map((feedback) => (
                    <div
                      key={feedback.feedback_id}
                      className="border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant={
                            feedback.rating === 'positive'
                              ? 'default'
                              : 'destructive'
                          }
                          className="flex items-center gap-1"
                        >
                          {feedback.rating === 'positive' ? (
                            <ThumbsUp className="h-3 w-3" />
                          ) : (
                            <ThumbsDown className="h-3 w-3" />
                          )}
                          {feedback.rating}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(feedback.created_at)}
                        </span>
                      </div>
                      <div className="bg-muted p-3 rounded-md mb-2">
                        <p className="text-sm">{feedback.message_content}</p>
                      </div>
                      {feedback.comment && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">
                            User Comment:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {feedback.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Negative Feedback Tab */}
        <TabsContent value="negative" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Negative Feedback</CardTitle>
              <CardDescription>Feedback that needs attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {negativeFeedback.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No negative feedback
                  </p>
                ) : (
                  negativeFeedback.map((feedback) => (
                    <div
                      key={feedback.feedback_id}
                      className="border border-red-200 dark:border-red-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant="destructive"
                          className="flex items-center gap-1"
                        >
                          <ThumbsDown className="h-3 w-3" />
                          Negative
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(feedback.created_at)}
                        </span>
                      </div>
                      <div className="bg-muted p-3 rounded-md mb-2">
                        <p className="text-sm">{feedback.message_content}</p>
                      </div>
                      {feedback.comment && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">
                            User Comment:
                          </p>
                          <p className="text-sm">{feedback.comment}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback with Comments</CardTitle>
              <CardDescription>Detailed feedback from users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commentFeedback.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No comments yet
                  </p>
                ) : (
                  commentFeedback.map((feedback) => (
                    <div
                      key={feedback.feedback_id}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant={
                            feedback.rating === 'positive'
                              ? 'default'
                              : 'destructive'
                          }
                          className="flex items-center gap-1"
                        >
                          {feedback.rating === 'positive' ? (
                            <ThumbsUp className="h-3 w-3" />
                          ) : (
                            <ThumbsDown className="h-3 w-3" />
                          )}
                          {feedback.rating}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(feedback.created_at)}
                        </span>
                      </div>
                      <div className="bg-muted p-3 rounded-md mb-2">
                        <p className="text-sm">{feedback.message_content}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">
                          User Comment:
                        </p>
                        <p className="text-sm">{feedback.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Tab */}
        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>30-Day Trend</CardTitle>
              <CardDescription>
                Feedback trends over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trend.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No trend data available
                </p>
              ) : (
                <div className="space-y-2">
                  {trend.slice(0, 10).map((data, index) => {
                    const positivePercentage =
                      data.total > 0 ? (data.positive / data.total) * 100 : 0
                    return (
                      <div key={index} className="border-b pb-2 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {new Date(data.date).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {data.total} total feedback
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${positivePercentage}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-green-600 flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {data.positive}
                            </span>
                            <span className="text-red-600 flex items-center gap-1">
                              <ThumbsDown className="h-3 w-3" />
                              {data.negative}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
