# Bus Image Upload Setup with Cloudinary

## Overview

The bus management system now supports multi-image uploads for buses using Cloudinary as the image hosting service.

## Setup Instructions

### 1. Cloudinary Account Setup

1. Create a free account at [Cloudinary](https://cloudinary.com/users/register/free)
2. Go to your Cloudinary Dashboard and note down:
   - **Cloud Name** - Found in the API Environment section
   - **Upload Preset** - Create a new unsigned upload preset for better security

#### Creating an Upload Preset:

1. In Cloudinary Dashboard, go to **Settings → Upload**
2. Scroll to **Upload presets** section
3. Click **Add upload preset**
4. Fill in the details:
   - **Name**: `bus_images` (or your preferred name)
   - **Unsigned**: Toggle ON (for client-side uploads)
   - **Folder**: `/bus-tickets/buses` (optional, for organization)
   - **Save**

### 2. Frontend Configuration

Create a `.env.local` file in the `frontend` directory (copy from `.env.example`):

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=bus_images
VITE_API_BASE_URL=http://localhost:3000/api
```

**Note:** Replace `your_cloud_name_here` with your actual Cloudinary Cloud Name.

### 3. Features

#### Multi-Image Upload

- Upload multiple images at once
- Drag-and-drop support
- Real-time upload progress indicator
- Image preview thumbnails
- Remove individual images from the gallery

#### Image Storage

- Images are stored in Cloudinary's CDN
- Image URLs are saved in the database as JSON array
- First image is used as the thumbnail in the table
- All images are accessible via the API

#### Supported Formats

- PNG, JPG, GIF, WebP
- Maximum 5MB per image
- Recommended dimensions: 16:9 aspect ratio

### 4. Database Migration

The system stores multiple images in the `image_url` column as a JSON array:

```json
[
  "https://res.cloudinary.com/.../image1.jpg",
  "https://res.cloudinary.com/.../image2.jpg"
]
```

For backward compatibility:

- Single image URLs are automatically converted to an array
- `image_url` field remains for backward compatibility
- `image_urls` array is returned in the API response

### 5. API Changes

#### Create Bus

```javascript
{
  "operator_id": "123",
  "name": "Express Bus",
  "model": "Volvo B11R",
  "plate_number": "51B-12345",
  "type": "sleeper",
  "capacity": 45,
  "amenities": ["wifi", "ac", "toilet"],
  "status": "active",
  "image_urls": [
    "https://res.cloudinary.com/.../image1.jpg",
    "https://res.cloudinary.com/.../image2.jpg"
  ]
}
```

#### Response

```javascript
{
  "success": true,
  "data": {
    "bus_id": "uuid",
    "name": "Express Bus (Volvo B11R)",
    "image_url": "https://res.cloudinary.com/.../image1.jpg",  // First image
    "image_urls": [
      "https://res.cloudinary.com/.../image1.jpg",
      "https://res.cloudinary.com/.../image2.jpg"
    ],
    ...
  }
}
```

### 6. Security Considerations

- Use unsigned upload presets (configured in Cloudinary dashboard)
- Set folder restrictions to `/bus-tickets/buses` in upload preset
- Optionally set transformation rules in Cloudinary
- API keys are never exposed on the client side

### 7. Troubleshooting

#### Images not uploading?

1. Check Cloudinary credentials in `.env.local`
2. Verify upload preset is set to "Unsigned"
3. Check browser console for CORS errors
4. Ensure file size is under 5MB

#### Images not displaying?

1. Check if image_urls are stored correctly in database
2. Verify Cloudinary URLs are accessible
3. Check CORS settings in Cloudinary dashboard

### 8. Testing

To test the feature:

1. Start the application
2. Go to Admin → Bus Management
3. Click "Add Bus" or edit an existing bus
4. In the "Bus Images" section, click to upload images
5. Upload multiple images and verify previews
6. Save the bus and check if images are displayed in the table
