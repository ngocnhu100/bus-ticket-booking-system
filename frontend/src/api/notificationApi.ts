import { request } from './auth'

interface NotificationPreference {
  email: boolean
  sms: boolean
}

interface UserPreferences {
  notifications: {
    bookingConfirmations: NotificationPreference
    tripReminders: NotificationPreference
    tripUpdates: NotificationPreference
    promotionalEmails: boolean
  }
}

interface UserProfile {
  userId: string | number
  email: string
  phone: string
  fullName: string
  role: string
  avatar?: string
  emailVerified: boolean
  phoneVerified: boolean
  preferences: UserPreferences
  createdAt: string
}

/**
 * Get current user's profile with preferences
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await request('/auth/me', { method: 'GET' })
    return response.data?.data || response.data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

/**
 * Update user's profile and preferences
 */
export const updateUserProfile = async (
  profileData: Partial<UserProfile>
): Promise<UserProfile> => {
  try {
    const response = await request('/auth/me', {
      method: 'PUT',
      body: profileData,
    })
    return response.data?.data || response.data
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

/**
 * Get default user preferences template
 */
export const getDefaultPreferences = (): UserPreferences => {
  return {
    notifications: {
      bookingConfirmations: { email: true, sms: true },
      tripReminders: { email: true, sms: false },
      tripUpdates: { email: true, sms: true },
      promotionalEmails: false,
    },
  }
}
