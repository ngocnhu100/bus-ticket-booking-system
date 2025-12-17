import { request } from './auth'

export interface Notification {
  id: string
  userId: string
  bookingId?: string | null
  type: 'booking' | 'trip' | 'update' | 'promo' | 'system'
  channel: 'email' | 'sms' | 'push'
  title: string
  message: string
  status: 'sent' | 'read' | 'failed'
  readAt?: string | null
  sentAt: string
  createdAt: string
  updatedAt: string
}

export interface NotificationStats {
  total: number
  unread: number
  read: number
  failed: number
  byType: Record<string, number>
  byChannel: Record<string, number>
}

/**
 * Get notifications for current user with optional filters
 */
export const getNotifications = async (params?: {
  limit?: number
  offset?: number
  type?: string
  channel?: string
  status?: string
}): Promise<Notification[]> => {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })
    }
    const queryString = queryParams.toString()
    const url = `/notification${queryString ? `?${queryString}` : ''}`

    const response = await request(url, { method: 'GET' })
    return response.data || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

/**
 * Get a single notification by ID
 */
export const getNotification = async (
  notificationId: string
): Promise<Notification | null> => {
  try {
    const response = await request(`/notification/${notificationId}`, {
      method: 'GET',
    })
    return response.data || null
  } catch (error) {
    console.error('Error fetching notification:', error)
    return null
  }
}

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<Notification | null> => {
  try {
    const response = await request(`/notification/${notificationId}/read`, {
      method: 'PUT',
    })
    return response.data || null
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return null
  }
}

/**
 * Get notification statistics for current user
 */
export const getNotificationStats =
  async (): Promise<NotificationStats | null> => {
    try {
      const response = await request('/notification/stats', {
        method: 'GET',
      })
      return response.data || null
    } catch (error) {
      console.error('Error fetching notification stats:', error)
      return null
    }
  }
