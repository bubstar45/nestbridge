'use client'
import { useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

// ✅ Single instance at module level — uses env vars correctly
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Helper: Extract photo key from Zillow URL or return as-is for uploaded images
function extractPhotoKey(url) {
  // For Zillow URLs: extract the photo key (the hash)
  const zillowMatch = url.match(/\/fp\/([a-f0-9]+)/)
  if (zillowMatch) return zillowMatch[1]
  
  // For uploaded images, we'll store the full path or key
  // You can modify this to extract just the filename if preferred
  return url
}

// Helper: Get display URL from photo key or full URL
function getDisplayUrl(value) {
  // If it's a Zillow photo key (32 chars hex)
  if (typeof value === 'string' && /^[a-f0-9]{32}$/.test(value)) {
    return `https://photos.zillowstatic.com/fp/${value}-p_h.webp`
  }
  // If it's a full URL (uploaded image)
  if (value.startsWith && value.startsWith('http')) {
    return value
  }
  // If it's a Supabase storage path
  return value
}

export default function ImageUploader({ listingId, existingImages = [], onChange }) {
  const [images, setImages] = useState(existingImages.map(img => {
    // Handle both object format {url: '...', position: 0} and plain strings
    if (typeof img === 'string') return img
    return img.url || img.photo_key || img
  }))
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileRef = useRef()

  // ── Upload from device (stores in Supabase Storage) ──────────────────
  const handleFiles = async (files) => {
    setUploading(true)
    const newImages = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        continue
      }

      const ext = file.name.split('.').pop()
      const path = `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('listing-images')
        .upload(path, file, { upsert: false })

      if (error) { 
        toast.error(`Failed to upload ${file.name}`)
        continue 
      }

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(path)

      // Store the full URL for uploaded images
      newImages.push(publicUrl)
    }

    const updated = [...images, ...newImages]
    setImages(updated)
    onChange?.(updated)
    setUploading(false)
    toast.success(`${newImages.length} photo(s) added`)
  }

  // ── Add by URL (supports both Zillow URLs and regular image URLs) ──────────
  const addUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (!trimmed.startsWith('http')) { 
      toast.error('Enter a valid URL')
      return 
    }
    
    // Extract photo key if it's a Zillow URL, otherwise keep full URL
    const photoKey = extractPhotoKey(trimmed)
    const updated = [...images, photoKey]
    setImages(updated)
    onChange?.(updated)
    setUrlInput('')
    toast.success('Photo added')
  }

  // ── Remove ──────────────────────────────────────────────
  const remove = (index) => {
    const updated = images.filter((_, i) => i !== index)
    setImages(updated)
    onChange?.(updated)
  }

  // ── Drag to reorder ─────────────────────────────────────
  const dragItem = useRef()
  const dragOver = useRef()

  const onDragStart = (i) => { dragItem.current = i }
  const onDragEnter = (i) => { dragOver.current = i }
  const onDragEnd = () => {
    const updated = [...images]
    const dragged = updated.splice(dragItem.current, 1)[0]
    updated.splice(dragOver.current, 0, dragged)
    setImages(updated)
    onChange?.(updated)
    dragItem.current = null
    dragOver.current = null
  }

  // ── Drop zone ───────────────────────────────────────────
  const onDrop = (e) => {
    e.preventDefault()
    handleFiles(Array.from(e.dataTransfer.files))
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(Array.from(e.target.files))}
        />
        {uploading ? (
          <p className="text-sm text-brand-500 font-medium">Uploading...</p>
        ) : (
          <>
            <div className="text-3xl mb-2">📸</div>
            <p className="text-sm font-medium text-gray-700">Drop photos here or click to upload</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — unlimited photos</p>
          </>
        )}
      </div>

      {/* URL paste */}
      <div className="flex gap-2">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addUrl()}
          placeholder="Or paste an image URL (Zillow link works too) and press Enter..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={addUrl}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Drag to reorder · First photo is the cover</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((img, i) => {
              const displayUrl = getDisplayUrl(img)
              const isZillow = typeof img === 'string' && /^[a-f0-9]{32}$/.test(img)
              
              return (
                <div
                  key={i}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragEnter={() => onDragEnter(i)}
                  onDragEnd={onDragEnd}
                  className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100 cursor-grab"
                >
                  {displayUrl ? (
                    <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-2xl">📷</span>
                    </div>
                  )}
                  {i === 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Cover
                    </span>
                  )}
                  {isZillow && (
                    <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[8px] px-1 py-0.5 rounded">
                      Zillow
                    </span>
                  )}
                  <button
                    onClick={() => remove(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}