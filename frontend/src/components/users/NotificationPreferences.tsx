import { useState, useEffect } from 'react'
import {
  Bell,
  Mail,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import Card from '@/components/Card'
import { useAuth } from '@/context/AuthContext'
import {
  getUserProfile,
  updateUserProfile,
  getDefaultPreferences,
} from '@/api/userProfileApi'

interface UserPreferences {
  notifications: {
    bookingConfirmations: {
      email: boolean
      sms: boolean
    }
    tripReminders: {
      email: boolean
      sms: boolean
    }
    tripUpdates: {
      email: boolean
      sms: boolean
    }
    promotionalEmails: boolean
  }
}

interface UserProfileData {
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

export const NotificationPreferences = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await getUserProfile()
      setProfile(data)
    } catch (error) {
      console.error('Failed to load profile:', error)
      setMessage({
        type: 'error',
        text: 'Failed to load preferences. Using defaults.',
      })
      // Set default profile structure
      setProfile({
        userId: user?.userId || '',
        email: user?.email || '',
        phone: user?.phone || '',
        fullName: user?.fullName || '',
        role: user?.role || 'passenger',
        emailVerified: false,
        phoneVerified: false,
        preferences: getDefaultPreferences(),
        createdAt: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.userId) {
      fetchProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId])

  const handleToggle = async (
    category:
      | 'bookingConfirmations'
      | 'tripReminders'
      | 'tripUpdates'
      | 'promotionalEmails',
    channel?: 'email' | 'sms'
  ) => {
    if (!profile) return

    const updatedProfile = { ...profile }

    if (category === 'promotionalEmails') {
      updatedProfile.preferences = {
        ...updatedProfile.preferences,
        notifications: {
          ...updatedProfile.preferences.notifications,
          promotionalEmails:
            !updatedProfile.preferences.notifications.promotionalEmails,
        },
      }
      // Clean up: remove promotionalEmails from root level if it exists (legacy support)
      if ('promotionalEmails' in updatedProfile.preferences) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { promotionalEmails: _promotionalEmails, ...rest } =
          updatedProfile.preferences as UserPreferences & {
            promotionalEmails?: boolean
          }
        updatedProfile.preferences = rest as UserPreferences
      }
    } else if (channel) {
      updatedProfile.preferences = {
        ...updatedProfile.preferences,
        notifications: {
          ...updatedProfile.preferences.notifications,
          [category]: {
            ...updatedProfile.preferences.notifications[category],
            [channel]:
              !updatedProfile.preferences.notifications[category][channel],
          },
        },
      }
    }

    // Update UI immediately
    setProfile(updatedProfile)
    setSaving(true)

    try {
      await updateUserProfile(updatedProfile)
      setMessage({
        type: 'success',
        text: 'Preferences updated successfully',
      })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Failed to update preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save preferences' })
      // Revert on error
      setProfile(profile)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <Bell className="w-8 h-8 text-primary" />
        </div>
        <span className="ml-4 text-muted-foreground">
          Loading preferences...
        </span>
      </div>
    )
  }

  if (!profile) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">Failed to load user profile</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary" />
          Notification Preferences
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage how you receive updates about your bookings and trips
        </p>
      </div>

      {/* Status Messages */}
      {message && (
        <Card
          className={`p-4 flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <p
            className={
              message.type === 'success'
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }
          >
            {message.text}
          </p>
        </Card>
      )}

      {/* Booking Confirmations */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Booking Confirmations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Receive confirmation when your booking is complete
          </p>
          <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <AlertCircle className="w-4 h-4 text-yellow-700 dark:text-yellow-300" />
            <span className="text-xs text-yellow-700 dark:text-yellow-300">
              Critical notification - cannot be disabled
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Booking Confirmation Email */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 dark:bg-secondary/50 rounded-lg border border-border dark:border-border/70">
            <div className="flex-1">
              <p className="font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">
                Booking reference and e-ticket
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-not-allowed">
              <input
                type="checkbox"
                checked={
                  profile.preferences.notifications.bookingConfirmations?.email
                }
                disabled={true}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2 dark:peer-focus:ring-offset-background rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:ring-1 peer-checked:ring-primary" />
            </label>
          </div>

          {/* Booking Confirmation SMS */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 dark:bg-secondary/50 rounded-lg border border-border dark:border-border/70">
            <div className="flex-1">
              <p className="font-medium flex items-center gap-2 text-foreground">
                <MessageSquare className="w-4 h-4" />
                SMS
              </p>
              <p className="text-sm text-muted-foreground">
                Quick confirmation and reference number
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-not-allowed">
              <input
                type="checkbox"
                checked={
                  profile.preferences.notifications.bookingConfirmations?.sms
                }
                disabled={true}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2 dark:peer-focus:ring-offset-background rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:ring-1 peer-checked:ring-primary" />
            </label>
          </div>
        </div>
      </Card>

      {/* Trip Reminders */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Trip Reminders
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Get reminded 24 hours and 2 hours before your trip
          </p>
        </div>

        <div className="space-y-3">
          {/* Trip Reminder Email */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 dark:bg-secondary/50 rounded-lg border border-border dark:border-border/70">
            <div className="flex-1">
              <p className="font-medium text-foreground">Email Reminders</p>
              <p className="text-sm text-muted-foreground">
                Trip details and boarding information
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.preferences.notifications.tripReminders?.email}
                onChange={() => handleToggle('tripReminders', 'email')}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2 dark:peer-focus:ring-offset-background rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:ring-1 peer-checked:ring-primary disabled:opacity-50 disabled:cursor-not-allowed" />
            </label>
          </div>

          {/* Trip Reminder SMS */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 dark:bg-secondary/50 rounded-lg border border-border dark:border-border/70">
            <div className="flex-1">
              <p className="font-medium flex items-center gap-2 text-foreground">
                <MessageSquare className="w-4 h-4" />
                SMS Reminders
              </p>
              <p className="text-sm text-muted-foreground">
                Quick reminders with boarding info
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.preferences.notifications.tripReminders?.sms}
                onChange={() => handleToggle('tripReminders', 'sms')}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2 dark:peer-focus:ring-offset-background rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:ring-1 peer-checked:ring-primary disabled:opacity-50 disabled:cursor-not-allowed" />
            </label>
          </div>
        </div>
      </Card>

      {/* Trip Updates */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Trip Updates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Notifications about delays, changes, or cancellations
          </p>
        </div>

        <div className="space-y-3">
          {/* Trip Update Email */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 dark:bg-secondary/50 rounded-lg border border-border dark:border-border/70">
            <div className="flex-1">
              <p className="font-medium text-foreground">Email Updates</p>
              <p className="text-sm text-muted-foreground">
                Detailed information about changes
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.preferences.notifications.tripUpdates?.email}
                onChange={() => handleToggle('tripUpdates', 'email')}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2 dark:peer-focus:ring-offset-background rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:ring-1 peer-checked:ring-primary disabled:opacity-50 disabled:cursor-not-allowed" />
            </label>
          </div>

          {/* Trip Update SMS */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 dark:bg-secondary/50 rounded-lg border border-border dark:border-border/70">
            <div className="flex-1">
              <p className="font-medium flex items-center gap-2 text-foreground">
                <MessageSquare className="w-4 h-4" />
                SMS Updates
              </p>
              <p className="text-sm text-muted-foreground">
                Urgent updates for immediate action
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.preferences.notifications.tripUpdates?.sms}
                onChange={() => handleToggle('tripUpdates', 'sms')}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2 dark:peer-focus:ring-offset-background rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary disabled:opacity-50 disabled:cursor-not-allowed" />
            </label>
          </div>
        </div>
      </Card>

      {/* Promotional Emails */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Promotional Emails</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Special offers, discounts, and new features
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary/30 dark:bg-secondary/50 rounded-lg border border-border dark:border-border/70">
          <div className="flex-1">
            <p className="font-medium text-foreground">Marketing Emails</p>
            <p className="text-sm text-muted-foreground">
              Occasional emails about promotions and updates
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={profile.preferences.notifications.promotionalEmails}
              onChange={() => handleToggle('promotionalEmails')}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2 dark:peer-focus:ring-offset-background rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary disabled:opacity-50 disabled:cursor-not-allowed" />
          </label>
        </div>
      </Card>

      {/* Info Footer */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <p className="text-sm text-foreground">
          <span className="font-semibold">Note:</span> Your notification
          preferences apply to all your bookings and are saved immediately when
          changed.
        </p>
      </Card>
    </div>
  )
}
