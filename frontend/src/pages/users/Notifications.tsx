import { DashboardLayout } from '../../components/users/DashboardLayout'
import { NotificationPreferences } from '@/components/users/NotificationPreferences'
import { Card } from '@/components/ui/card'
import { Info, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  getNotifications,
  markNotificationAsRead,
  type Notification,
} from '@/api/notificationsApi'
import '@/styles/admin.css'

// Helper functions for display
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'read':
      return (
        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
      )
    case 'sent':
      return <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
    case 'failed':
      return <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
    default:
      return <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'booking':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    case 'trip':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
    case 'update':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
    case 'promo':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    case 'system':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-200'
  }
}

const formatTimeAgo = (date: string) => {
  const now = new Date()
  const sent = new Date(date)
  const diffMs = now.getTime() - sent.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return sent.toLocaleDateString()
}

const Notifications = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'preferences'>(
    'preferences'
  )
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter((n) => n.status === 'sent').length

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await getNotifications({ limit: 50 })
      // Sort notifications: unread first, then by sentAt descending
      const sortedNotifications = (data || []).sort((a, b) => {
        // Unread notifications first
        if (a.status === 'sent' && b.status !== 'sent') return -1
        if (b.status === 'sent' && a.status !== 'sent') return 1

        // Then sort by sentAt descending (newest first)
        return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      })
      setNotifications(sortedNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      // Update the local state to reflect the change and re-sort
      setNotifications((prev) =>
        prev
          .map((n) =>
            n.id === notificationId
              ? {
                  ...n,
                  status: 'read' as const,
                  readAt: new Date().toISOString(),
                }
              : n
          )
          .sort((a, b) => {
            // Unread notifications first
            if (a.status === 'sent' && b.status !== 'sent') return -1
            if (b.status === 'sent' && a.status !== 'sent') return 1

            // Then sort by sentAt descending (newest first)
            return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
          })
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      void fetchNotifications()
    }
  }, [activeTab])

  return (
    <DashboardLayout>
      <div>
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-border">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('preferences')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'preferences'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Notification Preferences
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Notification History
              {unreadCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Preferences Tab */}
        {activeTab === 'preferences' && <NotificationPreferences />}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="max-w-3xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Notification History
              </h1>
              <p className="text-muted-foreground">
                View all your notifications from your bookings and trips
                {unreadCount > 0 && (
                  <span className="ml-2 text-primary font-medium">
                    • {unreadCount} unread
                  </span>
                )}
              </p>
            </div>

            {loading && (
              <Card className="p-8 text-center">
                <div className="animate-spin inline-block">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground mt-4">
                  Loading notifications...
                </p>
              </Card>
            )}

            {!loading && notifications.length > 0 && (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`p-4 relative ${
                      notification.status === 'sent'
                        ? 'border-l-4 border-l-primary bg-primary/5'
                        : ''
                    }`}
                  >
                    {notification.status === 'sent' && (
                      <div className="absolute top-4 right-4 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        {getStatusIcon(notification.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">
                              {notification.title}
                            </h3>
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getTypeColor(
                                notification.type
                              )}`}
                            >
                              {notification.type}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-200 px-2 py-1 rounded-full capitalize">
                              {notification.channel}
                            </span>
                          </div>
                          {notification.status === 'failed' && (
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                              Failed to Send
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatTimeAgo(notification.sentAt)}</span>
                          {notification.bookingId && (
                            <span className="font-mono text-primary">
                              Ref: {notification.bookingId}
                            </span>
                          )}
                          {notification.status === 'sent' && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-primary hover:text-primary/80 transition-colors"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <Card className="p-8 text-center bg-secondary/30 dark:bg-secondary/20 border-2 border-dashed">
                <Info className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-foreground font-semibold mb-2">
                  No notifications yet
                </p>
                <p className="text-muted-foreground">
                  Your notification history will appear here as you make
                  bookings and receive updates.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Notifications
