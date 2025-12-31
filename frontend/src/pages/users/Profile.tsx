// Profile.tsx
import { useAuth } from '@/context/AuthContext' // Thêm dòng này
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { useState as useLocalState } from 'react'
import { Label } from '@/components/ui/label'

import React, { useState, useCallback } from 'react'
import defaultAvatar from '@/assets/default-avatar.jpg'
import {
  updateUserProfile,
  getUserProfile,
  changeUserPassword,
} from '@/api/userProfileApi'

const Profile = () => {
  // State cho hiển thị mật khẩu
  const [showCurrentPw, setShowCurrentPw] = useLocalState(false)
  const [showNewPw, setShowNewPw] = useLocalState(false)
  const [showConfirmPw, setShowConfirmPw] = useLocalState(false)
  const { user, updateUser } = useAuth()
  // State cho đổi mật khẩu
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [pwMessage, setPwMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [globalPwMessage, setGlobalPwMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [pwSaving, setPwSaving] = useState(false)

  const handlePwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPwForm({ ...pwForm, [e.target.name]: e.target.value })
  }
  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMessage(null)
    if (
      !pwForm.currentPassword ||
      !pwForm.newPassword ||
      !pwForm.confirmPassword
    ) {
      setPwMessage({ type: 'error', text: 'Please fill in all fields.' })
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({
        type: 'error',
        text: 'New password and confirmation do not match.',
      })
      return
    }
    setPwSaving(true)
    try {
      await changeUserPassword(pwForm)
      setGlobalPwMessage({
        type: 'success',
        text: 'Password changed successfully!',
      })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowChangePassword(false)
      setPwMessage(null)
    } catch (err) {
      setPwMessage({
        type: 'error',
        text:
          (err as Error & { error?: { message?: string } })?.error?.message ||
          (err as Error).message ||
          'Password change failed.',
      })
    } finally {
      setPwSaving(false)
    }
  }

  const [isEditing, setIsEditing] = useState(false)
  interface Preferences {
    language: string
    currency: string
    notifications: {
      bookingConfirmations: { email: boolean; sms: boolean }
      tripReminders: { email: boolean; sms: boolean }
      tripUpdates: { email: boolean; sms: boolean }
      promotionalEmails: boolean
    }
  }

  const safePreferences = useCallback(
    (raw: Preferences | undefined): Preferences => {
      return {
        language: raw?.language || 'vi',
        currency: raw?.currency || 'VND',
        notifications: raw?.notifications,
      }
    },
    []
  )
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    preferences: safePreferences(user?.preferences as Preferences | undefined),
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [saving, setSaving] = useState(false)

  // Khi user thay đổi (login lại), cập nhật form
  React.useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
      preferences: safePreferences(
        user?.preferences as Preferences | undefined
      ),
    })
  }, [user, safePreferences])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Xử lý upload avatar qua API backend
  // Chỉ lưu file vào state, upload khi Save
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        setMessage({
          type: 'error',
          text: 'Only images up to 5MB are allowed.',
        })
        return
      }
      setAvatarFile(file)
      setForm((prev) => ({
        ...prev,
        avatar: URL.createObjectURL(file),
      }))
    }
  }

  const handleEdit = () => setIsEditing(true)
  const handleCancel = () => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
      preferences: safePreferences(
        user?.preferences as Preferences | undefined
      ),
    })
    setIsEditing(false)
    setAvatarFile(null)
    setMessage(null)
  }
  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    // Validate tên không rỗng
    if (!form.fullName.trim()) {
      setMessage({ type: 'error', text: 'Full name cannot be empty.' })
      setSaving(false)
      return
    }
    // Validate số điện thoại Việt Nam (+84xxxxxxxxx hoặc 0xxxxxxxxx)
    const phoneRegex = /^(\+84|0)\d{9}$/
    if (!phoneRegex.test(form.phone.trim())) {
      setMessage({
        type: 'error',
        text: 'Phone number must be in the format +84xxxxxxxxx or 0xxxxxxxxx.',
      })
      setSaving(false)
      return
    }
    try {
      // ⚠️ KHÔNG gửi preferences - chỉ gửi fullName, phone, avatar
      const payload: {
        fullName: string
        phone: string
        avatar?: File
      } = {
        fullName: form.fullName,
        phone: form.phone,
      }
      if (avatarFile) {
        payload.avatar = avatarFile
      }
      const res = await updateUserProfile(payload)
      await updateUser()
      // Lấy lại profile mới nhất từ backend và đồng bộ lại form
      const latestProfile = await getUserProfile()
      setForm({
        fullName: latestProfile.fullName || '',
        email: latestProfile.email || '',
        phone: latestProfile.phone || '',
        avatar: latestProfile.avatar || '',
        preferences: safePreferences(
          latestProfile?.preferences as Preferences | undefined
        ),
      })
      setMessage({
        type: 'success',
        text: res.message || 'Profile updated successfully!',
      })
      setIsEditing(false)
      setAvatarFile(null)
    } catch (error: unknown) {
      let errorMessage = 'Failed to update profile'
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as unknown as { message?: string }).message === 'string'
      ) {
        errorMessage = (error as unknown as { message?: string })
          .message as string
      }
      setMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>
      <Card className="p-6">
        <div className="space-y-6">
          {message && (
            <div
              className={`p-2 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
            >
              {message.text}
            </div>
          )}
          {/* Avatar */}
          <div className="space-y-2 flex flex-col items-center">
            <Label>Avatar</Label>
            <img
              src={form.avatar || defaultAvatar}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover border"
            />
            {isEditing && (
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={saving}
              />
            )}
          </div>
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            {isEditing ? (
              <Input
                id="name"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                disabled={saving}
              />
            ) : (
              <div className="py-2 px-3 bg-muted rounded">{form.fullName}</div>
            )}
          </div>
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            {isEditing ? (
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                readOnly
                className="opacity-70 cursor-not-allowed"
                disabled
              />
            ) : (
              <div className="py-2 px-3 bg-muted rounded">{form.email}</div>
            )}
          </div>
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            {isEditing ? (
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                disabled={saving}
              />
            ) : (
              <div className="py-2 px-3 bg-muted rounded">{form.phone}</div>
            )}
          </div>
          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleEdit}>Edit</Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowChangePassword((v) => !v)}
                >
                  Change Password
                </Button>
              </>
            )}
          </div>

          {/* Global password message (thành công) */}
          {globalPwMessage && (
            <div
              className={`p-2 rounded text-sm mb-4 ${globalPwMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
            >
              {globalPwMessage.text}
            </div>
          )}
          {/* Change Password Form */}
          {showChangePassword && (
            <form className="mt-6 space-y-4 max-w-md" onSubmit={handlePwSubmit}>
              <h2 className="text-lg font-semibold">Change Password</h2>
              {pwMessage && (
                <div
                  className={`p-2 rounded text-sm ${pwMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {pwMessage.text}
                </div>
              )}
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPw ? 'text' : 'password'}
                    value={pwForm.currentPassword}
                    onChange={handlePwChange}
                    disabled={pwSaving}
                    onFocus={() => setShowCurrentPw(showCurrentPw)}
                  />
                  {(pwForm.currentPassword ||
                    document.activeElement?.id === 'currentPassword') && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                      tabIndex={-1}
                      onClick={() => setShowCurrentPw((v) => !v)}
                      aria-label={
                        showCurrentPw ? 'Hide password' : 'Show password'
                      }
                    >
                      {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPw ? 'text' : 'password'}
                    value={pwForm.newPassword}
                    onChange={handlePwChange}
                    disabled={pwSaving}
                    onFocus={() => setShowNewPw(showNewPw)}
                  />
                  {(pwForm.newPassword ||
                    document.activeElement?.id === 'newPassword') && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                      tabIndex={-1}
                      onClick={() => setShowNewPw((v) => !v)}
                      aria-label={showNewPw ? 'Hide password' : 'Show password'}
                    >
                      {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPw ? 'text' : 'password'}
                    value={pwForm.confirmPassword}
                    onChange={handlePwChange}
                    disabled={pwSaving}
                    onFocus={() => setShowConfirmPw(showConfirmPw)}
                  />
                  {(pwForm.confirmPassword ||
                    document.activeElement?.id === 'confirmPassword') && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPw((v) => !v)}
                      aria-label={
                        showConfirmPw ? 'Hide password' : 'Show password'
                      }
                    >
                      {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={pwSaving}>
                  {pwSaving ? 'Changing...' : 'Change Password'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowChangePassword(false)}
                  disabled={pwSaving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  )
}

export default Profile
