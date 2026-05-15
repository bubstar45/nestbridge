'use client'
import { useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

// ✅ Single instance at module level — uses env vars correctly
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ImageUploader({ listingId, existingImages = [], onChange }) {
  const [images, setImages] = useState(existingImages)
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileRef = useRef()
  // ❌ REMOVED: const supabase = createClient() — this was the crash

  // ── Upload from device ──────────────────────────────────
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

      if (error) { toast.error(`Failed to upload ${file.name}`); continue }

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(path)

      newImages.push({ url: publicUrl, position: images.length + newImages.length })
    }

    const updated = [...images, ...newImages]
    setImages(updated)
    onChange?.(updated)
    setUploading(false)
    toast.success(`${newImages.length} photo(s) added`)
  }

  // ── Add by URL ──────────────────────────────────────────
  const addUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (!trimmed.startsWith('http')) { toast.error('Enter a valid URL'); return }
    const updated = [...images, { url: trimmed, position: images.length }]
    setImages(updated)
    onChange?.(updated)
    setUrlInput('')
  }

  // ── Remove ──────────────────────────────────────────────
  const remove = (index) => {
    const updated = images.filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, position: i }))
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
    const reordered = updated.map((img, i) => ({ ...img, position: i }))
    setImages(reordered)
    onChange?.(reordered)
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
          placeholder="Or paste an image URL and press Enter..."
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
            {images.map((img, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragEnter={() => onDragEnter(i)}
                onDragEnd={onDragEnd}
                className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100 cursor-grab"
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Cover
                  </span>
                )}
                <button
                  onClick={() => remove(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}