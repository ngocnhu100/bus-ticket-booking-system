// Profile.tsx
import { useAuth } from '@/context/AuthContext' // Thêm dòng này
import { DashboardLayout } from '../../components/users/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import React, { useState } from 'react'
import { updateUserProfile } from '@/api/userProfileApi'
// ...existing code...
const Profile = () => {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
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
    })
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleEdit = () => setIsEditing(true)
  const handleCancel = () => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    })
    setIsEditing(false)
  }
  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await updateUserProfile({
        fullName: form.fullName,
        phone: form.phone,
      })
      await updateUser() // Lấy lại thông tin user mới nhất từ API
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
    } catch (error: unknown) {
      let errorMessage = 'Failed to update profile'
      interface ErrorWithMessage {
        message: string
      }
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as ErrorWithMessage).message === 'string'
      ) {
        errorMessage = (error as ErrorWithMessage).message
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
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account information
          </p>
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
                <div className="py-2 px-3 bg-muted rounded">
                  {form.fullName}
                </div>
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
                <Button onClick={handleEdit}>Edit</Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Profile
