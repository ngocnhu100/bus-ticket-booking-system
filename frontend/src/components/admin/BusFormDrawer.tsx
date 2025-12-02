import React, { useState, useEffect } from 'react'
import type { BusAdminData } from '@/types/trip.types'
import { CustomDropdown } from '../ui/custom-dropdown'
import { Loader } from 'lucide-react'

const emptyForm: Omit<BusAdminData, 'busId' | 'createdAt'> = {
  name: '',
  model: '',
  plate_number: '',
  type: 'standard',
  capacity: 20,
  amenities: [],
  status: 'active',
}

interface BusFormDrawerProps {
  open: boolean
  onClose: () => void
  initialBus: BusAdminData | null
  onSave: (values: Omit<BusAdminData, 'busId' | 'createdAt'>) => void
}

const AMENITIES_OPTIONS = [
  { id: 'WiFi', label: 'WiFi' },
  { id: 'AC', label: 'Air Conditioning' },
  { id: 'Toilet', label: 'Toilet' },
  { id: 'Entertainment', label: 'Entertainment System' },
  { id: 'Sleeping Beds', label: 'Sleeping Beds' },
  { id: 'Catering', label: 'Catering' },
]

export const BusFormDrawer: React.FC<BusFormDrawerProps> = ({
  open,
  onClose,
  initialBus,
  onSave,
}) => {
  const [form, setForm] =
    useState<Omit<BusAdminData, 'busId' | 'createdAt'>>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialBus) {
      setForm({
        name: initialBus.name,
        model: initialBus.model,
        plate_number: initialBus.plate_number,
        type: initialBus.type,
        capacity: initialBus.capacity,
        amenities: initialBus.amenities,
        status: initialBus.status,
      })
    } else {
      setForm(emptyForm)
    }
  }, [initialBus, open])

  const handleChange = (field: keyof typeof form, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(form)
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
            ✕
          </button>
        </div>

        <form
          className="flex-1 space-y-4 overflow-auto px-5 py-4"
          onSubmit={handleSubmit}
        >
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
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
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                }}
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Luxury Express"
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Model *
              </label>
              <input
                type="text"
                required
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                }}
                value={form.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="e.g., Hyundai Universe"
              />
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
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                }}
                value={form.plate_number}
                onChange={(e) => handleChange('plate_number', e.target.value)}
                placeholder="e.g., 51B-12345"
              />
            </div>
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
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                  value={form.capacity}
                  onChange={(e) =>
                    handleChange('capacity', Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Status
              </label>
              <CustomDropdown
                options={[
                  { id: 'active', label: 'Active' },
                  { id: 'inactive', label: 'Inactive' },
                ]}
                value={form.status}
                onChange={(value) =>
                  handleChange('status', value as 'active' | 'inactive')
                }
                placeholder="Select status"
              />
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
