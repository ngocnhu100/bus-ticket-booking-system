// Profile.tsx
import { useAuth } from '@/context/AuthContext' // Thêm dòng này
import { DashboardLayout } from '../../components/users/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import React, { useState } from 'react'
// Không dùng updateUserProfile cũ nữa, tự gọi request
import { request } from '@/api/auth'
// ...existing code...
const Profile = () => {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
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
    })
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Xử lý upload avatar qua API backend
  // Chỉ lưu file vào state, upload khi Save
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0])
      setForm((prev) => ({
        ...prev,
        avatar: URL.createObjectURL(e.target.files[0]),
      }))
    }
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
      let res
      if (avatarFile) {
        // Nếu có file ảnh, gửi multipart/form-data
        const formData = new FormData()
        formData.append('fullName', form.fullName)
        formData.append('phone', form.phone)
        formData.append('avatar', avatarFile)
        res = await request('/users/profile', {
          method: 'PUT',
          body: formData,
        })
      } else {
        // Không có file, gửi JSON
        res = await request('/users/profile', {
          method: 'PUT',
          body: {
            fullName: form.fullName,
            phone: form.phone,
            avatar: form.avatar,
          },
        })
      }
      await updateUser() // Lấy lại thông tin user mới nhất từ API
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
            {/* Avatar */}
            <div className="space-y-2 flex flex-col items-center">
              <Label>Avatar</Label>
              <img
                src={form.avatar || '/default-avatar.png'}
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
