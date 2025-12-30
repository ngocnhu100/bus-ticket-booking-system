import React, { useState, useEffect, useRef } from 'react'
import type { BusAdminData } from '@/types/trip.types'
import { CustomDropdown } from '../ui/custom-dropdown'
import { Loader, X } from 'lucide-react'
import { requestFormData, request } from '@/api/auth'

interface BusModel {
  bus_model_id: string
  name: string
}

const emptyForm: Omit<BusAdminData, 'bus_id' | 'created_at'> = {
  operator_id: '',
  name: '',
  model: '',
  plate_number: '',
  type: 'standard',
  capacity: 20,
  amenities: [],
  image_urls: [],
  status: 'maintenance',
}

interface BusFormDrawerProps {
  open: boolean
  onClose: () => void
  initialBus: BusAdminData | null
  onSave: (values: Omit<BusAdminData, 'bus_id' | 'created_at'>) => void
  operators: Array<{ id: string; label: string }>
  busModels?: BusModel[]
  onRefresh?: () => void
}

const AMENITIES_OPTIONS = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'toilet', label: 'Toilet' },
  { id: 'tv', label: 'TV' },
  { id: 'entertainment', label: 'Entertainment System' },
  { id: 'blanket', label: 'Blanket' },
  { id: 'water', label: 'Water' },
  { id: 'usb', label: 'USB Charging' },
  { id: 'reading_light', label: 'Reading Light' },
  { id: 'massage', label: 'Massage' },
  { id: 'pillow', label: 'Pillow' },
]

// Extract public_id from Cloudinary URL
const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    // Example: https://res.cloudinary.com/dleqkiaj0/image/upload/v1766998906/bus-tickets/buses/zbewsupwojqgbe6jlfyj.jpg
    // The public_id for deletion should be: bus-tickets/buses/zbewsupwojqgbe6jlfyj (without version prefix)
    const urlParts = url.split('/upload/')
    if (urlParts.length < 2) return null
    let afterUpload = urlParts[1]

    // Remove file extension (everything after the last dot)
    const lastDotIndex = afterUpload.lastIndexOf('.')
    if (lastDotIndex !== -1) {
      afterUpload = afterUpload.substring(0, lastDotIndex)
    }

    // Remove version prefix if it exists (e.g., v1766998906/)
    // Version prefix format: vNUMBERS/
    const versionMatch = afterUpload.match(/^v\d+\//)
    if (versionMatch) {
      afterUpload = afterUpload.substring(versionMatch[0].length)
    }

    return afterUpload
  } catch (error) {
    console.error('Error extracting public_id:', error)
    return null
  }
}

export const BusFormDrawer: React.FC<BusFormDrawerProps> = ({
  open,
  onClose,
  initialBus,
  onSave,
  operators,
  busModels = [],
  onRefresh,
}) => {
  const [form, setForm] =
    useState<Omit<BusAdminData, 'bus_id' | 'created_at'>>(emptyForm)
  const [removedImagePublicIds, setRemovedImagePublicIds] = useState<string[]>(
    []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const setErrorsWithTimeout = (newErrors: Record<string, string>) => {
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = setTimeout(() => setErrors({}), 5000)
    } else {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
        errorTimeoutRef.current = null
      }
    }
  }

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (initialBus) {
      setForm({
        operator_id: initialBus.operator_id,
        name: initialBus.name,
        model: initialBus.model,
        plate_number: initialBus.plate_number,
        type: initialBus.type,
        capacity: initialBus.capacity,
        status: initialBus.status,
        amenities: initialBus.amenities,
        image_urls:
          initialBus.image_urls ||
          (initialBus.image_url ? [initialBus.image_url] : []),
      })
    } else {
      setForm(emptyForm)
    }
    setRemovedImagePublicIds([])
    setErrors({})
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = null
    }
  }, [initialBus, open])

  const handleChange = (field: keyof typeof form, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrorsWithTimeout(newErrors)
    }
  }

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const uploadToCloudinary = async (file: File): Promise<string> => {
    console.log('[FE Upload] Uploading file:', file.name, file.size, file.type)
    const formData = new FormData()
    formData.append('file', file)
    console.log('[FE Upload] FormData created with file')

    try {
      console.log('[FE Upload] Sending to /trips/upload/image')
      const data = await requestFormData('/trips/upload/image', {
        method: 'POST',
        body: formData,
      })
      console.log('[FE Upload] Response:', data)

      if (!data.success || !data.data?.url) {
        throw new Error('Failed to get image URL from server')
      }

      return data.data.url
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setIsUploading(true)
    setUploadProgress(0)
    // Clear any previous upload errors when starting new upload
    setErrorsWithTimeout({ ...errors, image_upload: '' })

    try {
      const uploadPromises = files.map((file) => uploadToCloudinary(file))
      const uploadedUrls = await Promise.all(uploadPromises)

      setForm((prev) => ({
        ...prev,
        image_urls: [...(prev.image_urls || []), ...uploadedUrls],
      }))

      setUploadProgress(100)
      setTimeout(() => setUploadProgress(0), 1000)
      // Clear any upload errors on success
      setErrorsWithTimeout({ ...errors, image_upload: '' })
    } catch (error) {
      console.error('Image upload error:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to upload images. Please try again.'
      setErrorsWithTimeout({ ...errors, image_upload: errorMessage })
    } finally {
      setIsUploading(false)
    }

    // Reset file input
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    const imageUrl = form.image_urls?.[index]
    if (!imageUrl) return

    const publicId = extractPublicIdFromUrl(imageUrl)
    if (publicId) {
      // Track this image for deletion when saving
      setRemovedImagePublicIds((prev) => [...prev, publicId])
    }

    // Remove from form immediately (visual feedback)
    setForm((prev) => ({
      ...prev,
      image_urls: prev.image_urls?.filter((_, i) => i !== index) || [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const newErrors: Record<string, string> = {}
    if (!form.model.trim()) newErrors.model = 'Bus model is required'
    if (!form.plate_number.trim())
      newErrors.plate_number = 'Plate number is required'
    else if (!/^[0-9]{2}[A-Z]-[0-9]{3}\.[0-9]{2}$/.test(form.plate_number)) {
      newErrors.plate_number =
        'Plate number format is invalid (e.g., 51B-123.45)'
    }
    if (!initialBus && !form.operator_id)
      newErrors.operator_id = 'Operator is required'
    if (form.capacity < 1 || form.capacity > 100)
      newErrors.capacity = 'Capacity must be between 1 and 100'

    setErrorsWithTimeout(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsSubmitting(true)
    try {
      // Delete removed images from Cloudinary before saving
      if (removedImagePublicIds.length > 0) {
        console.log(
          '[FE Submit] Deleting removed images:',
          removedImagePublicIds
        )
        await Promise.all(
          removedImagePublicIds.map((publicId) =>
            request(
              `/trips/upload/image?publicId=${encodeURIComponent(publicId)}`,
              { method: 'DELETE' }
            ).catch((error) => {
              console.error(
                '[FE Submit] Failed to delete image:',
                publicId,
                error
              )
              // Continue with save even if deletion fails
            })
          )
        )
      }

      // Generate name from model and plate number
      const generatedName = `${form.model} (${form.plate_number})`
      const formData = initialBus
        ? { ...form, name: generatedName }
        : { ...form, name: generatedName, status: 'maintenance' as const }
      await onSave(formData)
      // Refresh the table after successful form submission
      onRefresh?.()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div
        className="flex-1"
        style={{
          backgroundColor: 'var(--background)',
          opacity: 0.8,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="flex h-full w-full max-w-md flex-col shadow-2xl"
        style={{ backgroundColor: 'var(--card)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              {initialBus ? 'Edit Bus' : 'Add Bus'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Enter bus details and select amenities.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 transition"
            style={{
              color: 'var(--muted-foreground)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)'
              e.currentTarget.style.color = 'var(--foreground)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--muted-foreground)'
            }}
            aria-label="Close"
          >
            <X />
          </button>
        </div>

        <form
          className="flex-1 space-y-4 overflow-auto px-5 py-4"
          onSubmit={handleSubmit}
        >
          {/* Basic Info */}
          <div className="space-y-3">
            {/* <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Bus Name *
              </label>
              <input
                type="text"
                required
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  border: `1px solid ${errors.name ? 'red' : 'var(--border)'}`,
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                }}
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Luxury Express"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div> */}

            <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Model *
              </label>
              <CustomDropdown
                options={busModels.map((model) => ({
                  id: model.name,
                  label: model.name,
                }))}
                value={form.model}
                onChange={(value) => handleChange('model', value)}
                placeholder="Select a bus model"
              />
              {errors.model && (
                <p className="text-red-500 text-xs mt-1">{errors.model}</p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Plate Number *
              </label>
              <input
                type="text"
                required
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  border: `1px solid ${errors.plate_number ? 'red' : 'var(--border)'}`,
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                }}
                value={form.plate_number}
                onChange={(e) => handleChange('plate_number', e.target.value)}
                placeholder="e.g., 51B-12345"
              />
              {errors.plate_number && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.plate_number}
                </p>
              )}
            </div>

            {!initialBus && (
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Operator *
                </label>
                <CustomDropdown
                  options={operators}
                  value={form.operator_id || ''}
                  onChange={(value) => handleChange('operator_id', value)}
                  placeholder="Select operator"
                />
                {errors.operator_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.operator_id}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Configuration */}
          <div className="space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Configuration
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Type *
                </label>
                <CustomDropdown
                  options={[
                    { id: 'standard', label: 'Standard' },
                    { id: 'limousine', label: 'Limousine' },
                    { id: 'sleeper', label: 'Sleeper' },
                  ]}
                  value={form.type}
                  onChange={(value) =>
                    handleChange(
                      'type',
                      value as 'standard' | 'limousine' | 'sleeper'
                    )
                  }
                  placeholder="Select type"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Capacity (seats) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    border: `1px solid ${errors.capacity ? 'red' : 'var(--border)'}`,
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                  value={form.capacity}
                  onChange={(e) =>
                    handleChange('capacity', Number(e.target.value))
                  }
                />
                {errors.capacity && (
                  <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>
                )}
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Amenities
            </h3>
            <div className="space-y-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <label key={amenity.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(amenity.id)}
                    onChange={() => toggleAmenity(amenity.id)}
                    className="rounded"
                    style={{
                      accentColor: 'var(--primary)',
                    }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {amenity.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Bus Images
            </h3>

            {/* Upload Area */}
            <label
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer transition"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--muted)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)'
                e.currentTarget.style.opacity = '0.1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted)'
                e.currentTarget.style.opacity = '1'
              }}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
              />
              <div
                className="text-center"
                style={{ color: 'var(--foreground)' }}
              >
                <p className="text-xs font-medium">
                  {isUploading
                    ? `Uploading... ${uploadProgress}%`
                    : 'Click to upload images'}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  PNG, JPG or GIF (max 5MB each)
                </p>
              </div>
              {isUploading && (
                <div className="w-full bg-muted rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: `${uploadProgress}%`,
                      backgroundColor: 'var(--primary)',
                    }}
                  />
                </div>
              )}
            </label>

            {/* Upload Error */}
            {errors.image_upload && (
              <p className="text-red-500 text-xs mt-1">{errors.image_upload}</p>
            )}

            {/* Image Preview Grid */}
            {form.image_urls && form.image_urls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.image_urls.map((url, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg overflow-hidden aspect-square group"
                    style={{ backgroundColor: 'var(--muted)' }}
                  >
                    <img
                      src={url}
                      alt={`Bus image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      style={{
                        backgroundColor: 'var(--destructive)',
                        color: 'var(--destructive-foreground)',
                      }}
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2 text-sm font-medium transition"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2 text-sm font-medium transition inline-flex items-center gap-2"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                'color-mix(in srgb, var(--primary) 90%, black)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary)'
            }}
          >
            {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
            {initialBus ? 'Save Changes' : 'Add Bus'}
          </button>
        </div>
      </div>
    </div>
  )
}
