import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoUploadProps {
  photos: File[]
  onPhotosChange: (photos: File[]) => void
  maxPhotos?: number
  disabled?: boolean
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  disabled = false,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return

    const newFiles = Array.from(files).filter((file) => {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        console.warn('File is not an image:', file.name)
        return false
      }
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        console.warn('File too large:', file.name)
        return false
      }
      // Check for duplicates (same name, size, and lastModified)
      const isDuplicate = photos.some(
        (existingFile) =>
          existingFile.name === file.name &&
          existingFile.size === file.size &&
          existingFile.lastModified === file.lastModified
      )
      if (isDuplicate) {
        console.warn('Duplicate file detected:', file.name)
        return false
      }
      return true
    })

    const totalPhotos = photos.length + newFiles.length
    if (totalPhotos > maxPhotos) {
      console.warn(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    onPhotosChange([...photos, ...newFiles])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(newPhotos)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="font-semibold text-foreground">
          Add Photos (Optional)
        </label>
        <span className="text-xs text-muted-foreground">
          {photos.length}/{maxPhotos}
        </span>
      </div>

      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <Card
          className={cn(
            'border-2 border-dashed transition-colors cursor-pointer',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <div className="p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">
              Drag & drop photos here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF up to 5MB each
            </p>
          </div>
        </Card>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <Card className="aspect-square overflow-hidden">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    removePhoto(index)
                  }}
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Card>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {photo.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        Photos help other travelers see your experience. Maximum {maxPhotos}{' '}
        photos.
      </p>
    </div>
  )
}
