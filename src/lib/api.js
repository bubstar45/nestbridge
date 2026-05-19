import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Helper: Convert photo key to display URL
function getPhotoUrl(photoKey, quality = 'hd') {
  if (!photoKey) return null
  if (photoKey.startsWith('http')) return photoKey // Already a full URL
  
  const qualities = {
    thumbnail: '-p_e.webp',
    hd: '-p_h.webp',
    large: '-p_10.webp',
    original: ''
  }
  const suffix = qualities[quality] || qualities.hd
  return `https://photos.zillowstatic.com/fp/${photoKey}${suffix}`
}

// Listings - Now uses photo_keys from listing_images table
export const getListings = async (params = {}) => {
  let query = supabase
    .from('listings')
    .select(`
      *,
      listing_images (
        photo_key,
        position
      )
    `)
    .eq('is_active', true)
  
  if (params.city) query = query.ilike('city', `%${params.city}%`)
  if (params.type) query = query.eq('type', params.type)
  if (params.mode) query = query.eq('listing_mode', params.mode)
  if (params.limit) query = query.limit(params.limit)
  
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  
  // Transform to add photo_keys array and images array for backward compatibility
  const transformedData = data?.map(listing => ({
    ...listing,
    photo_keys: listing.listing_images
      ?.sort((a, b) => a.position - b.position)
      .map(img => img.photo_key) || [],
    // Backward compatibility: also provide images array with full URLs
    images: listing.listing_images
      ?.sort((a, b) => a.position - b.position)
      .map(img => ({ url: getPhotoUrl(img.photo_key, 'hd') })) || []
  })) || []
  
  return { data: { listings: transformedData } }
}

// Get single listing - Now uses photo_keys
export const getListing = async (id) => {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      listing_images (
        photo_key,
        position
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  
  // Transform to add photo_keys and images arrays
  const transformedData = {
    ...data,
    photo_keys: data.listing_images
      ?.sort((a, b) => a.position - b.position)
      .map(img => img.photo_key) || [],
    // Backward compatibility: also provide images array with full URLs
    images: data.listing_images
      ?.sort((a, b) => a.position - b.position)
      .map(img => ({ url: getPhotoUrl(img.photo_key, 'hd') })) || []
  }
  
  return { data: transformedData }
}

// Get images for a listing (returns photo keys)
export const getListingImages = async (listingId) => {
  const { data, error } = await supabase
    .from('listing_images')
    .select('photo_key, position')
    .eq('listing_id', listingId)
    .order('position', { ascending: true })
  
  if (error) throw error
  return { data: data?.map(img => img.photo_key) || [] }
}

// Update images for a listing - stores photo_keys
export const updateListingImages = async (listingId, images) => {
  // First delete existing images
  const { error: deleteError } = await supabase
    .from('listing_images')
    .delete()
    .eq('listing_id', listingId)
  
  if (deleteError) throw deleteError
  
  // Then insert new images
  if (images && images.length > 0) {
    const imageRecords = images.map((image, index) => {
      // If it's a full URL, extract the photo key
      let photoKey = image
      if (typeof image === 'string' && image.includes('photos.zillowstatic.com')) {
        const match = image.match(/\/fp\/([a-f0-9]+)/)
        if (match) photoKey = match[1]
      }
      // If it's an object with url property (backward compatibility)
      if (typeof image === 'object' && image.url) {
        const match = image.url.match(/\/fp\/([a-f0-9]+)/)
        photoKey = match ? match[1] : image.url
      }
      
      return {
        listing_id: listingId,
        photo_key: photoKey,
        position: index
      }
    })
    
    const { error: insertError } = await supabase
      .from('listing_images')
      .insert(imageRecords)
    
    if (insertError) throw insertError
  }
  
  return { data: images }
}

// Save listing images (alias for updateListingImages)
export const saveListingImages = async (listingId, images) => {
  return updateListingImages(listingId, images)
}

// Applications
export const createApplication = async (data) => {
  const { data: result, error } = await supabase.from('applications').insert(data).select().single()
  if (error) throw error
  return { data: result }
}

export const getMyApplications = async () => {
  const { data, error } = await supabase
    .from('applications')
    .select('*, listings(*)')
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return { data }
}

export const getMyBookings = async (userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, listings(*)')
    .eq('user_id', userId)
    .order('booked_at', { ascending: false })
  if (error) {
    console.error('getMyBookings error:', error)
    throw error
  }
  return { data: data || [] }
}

export const createBooking = async (data) => {
  const { data: result, error } = await supabase
    .from('bookings')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return { data: result }
}

// Admin
export const getAdminStats = async () => {
  const [listingsRes, applicationsRes, pendingRes] = await Promise.all([
    supabase.from('listings').select('id', { count: 'exact', head: true }),
    supabase.from('applications').select('id', { count: 'exact', head: true }),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  return {
    data: {
      listings: listingsRes.count ?? 0,
      applications: applicationsRes.count ?? 0,
      pending: pendingRes.count ?? 0,
    }
  }
}

export const getAdminListings = async () => {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      listing_images (
        photo_key,
        position
      )
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  
  // Transform to include photo_keys and images arrays
  const transformedData = data?.map(listing => ({
    ...listing,
    photo_keys: listing.listing_images
      ?.sort((a, b) => a.position - b.position)
      .map(img => img.photo_key) || [],
    images: listing.listing_images
      ?.sort((a, b) => a.position - b.position)
      .map(img => ({ url: getPhotoUrl(img.photo_key, 'hd') })) || []
  })) || []
  
  return { data: transformedData }
}

export const getAdminApplications = async () => {
  const { data, error } = await supabase
    .from('applications')
    .select('*, listings(*)')
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return { data }
}

export const createListing = async (data) => {
  const { data: result, error } = await supabase.from('listings').insert(data).select().single()
  if (error) throw error
  return { data: result }
}

export const updateListing = async (id, data) => {
  const { data: result, error } = await supabase.from('listings').update(data).eq('id', id).select().single()
  if (error) throw error
  return { data: result }
}

export const deleteListing = async (id) => {
  const { error } = await supabase.from('listings').delete().eq('id', id)
  if (error) throw error
}

export const updateApplication = async (id, data) => {
  const { data: result, error } = await supabase.from('applications').update(data).eq('id', id).select().single()
  if (error) throw error
  return { data: result }
}

// Reviews
export const getReviews = async (listing_id) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('listing_id', listing_id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return { data }
}

export const createReview = async (data) => {
  const { data: result, error } = await supabase
    .from('reviews')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return { data: result }
}

export const deleteReview = async (id) => {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw error
}

// Coupons
export const validateCoupon = async (code) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()
  if (error) throw error
  return { data }
}

export const incrementCouponUse = async (id) => {
  const { error } = await supabase
    .rpc('increment_coupon_uses', { coupon_id: id })
  if (error) throw error
}

export const getAdminCoupons = async () => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return { data }
}

export const createCoupon = async (data) => {
  const { data: result, error } = await supabase
    .from('coupons')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return { data: result }
}

export const updateCoupon = async (id, data) => {
  const { data: result, error } = await supabase
    .from('coupons')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { data: result }
}

export const deleteCoupon = async (id) => {
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) throw error
}

export default supabase