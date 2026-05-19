import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Listings - FIXED: Now includes images from listing_images table
export const getListings = async (params = {}) => {
  let query = supabase
    .from('listings')
    .select(`
      *,
      listing_images (
        url,
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
  
  // Transform to match RentalCard expected format: images: [{ url: string }]
  const transformedData = data?.map(listing => ({
    ...listing,
    images: listing.listing_images
      ?.sort((a, b) => a.position - b.position)
      .map(img => ({ url: img.url })) || []
  })) || []
  
  return { data: { listings: transformedData } }
}

// Get single listing - FIXED: Now includes images
export const getListing = async (id) => {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      listing_images (
        url,
        position
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  
  // Transform to add images array
  const transformedData = {
    ...data,
    images: data.listing_images
      ?.sort((a, b) => a.position - b.position)
      .map(img => ({ url: img.url })) || []
  }
  
  return { data: transformedData }
}

// Get images for a listing (alternative method)
export const getListingImages = async (listingId) => {
  const { data, error } = await supabase
    .from('listing_images')
    .select('url, position')
    .eq('listing_id', listingId)
    .order('position', { ascending: true })
  
  if (error) throw error
  return { data: data?.map(img => img.url) || [] }
}

// Update images for a listing
export const updateListingImages = async (listingId, images) => {
  // First delete existing images
  const { error: deleteError } = await supabase
    .from('listing_images')
    .delete()
    .eq('listing_id', listingId)
  
  if (deleteError) throw deleteError
  
  // Then insert new images
  if (images && images.length > 0) {
    const imageRecords = images.map((url, index) => ({
      listing_id: listingId,
      url: url,
      position: index
    }))
    
    const { error: insertError } = await supabase
      .from('listing_images')
      .insert(imageRecords)
    
    if (insertError) throw insertError
  }
  
  return { data: images }
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
      listing_images (url, position)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  
  // Transform to include images array
  const transformedData = data?.map(listing => ({
    ...listing,
    images: listing.listing_images
      ?.sort((a, b) => a.position - b.position)
      .map(img => ({ url: img.url })) || []
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

export const saveListingImages = async (listingId, images) => {
  // First delete existing images
  const { error: deleteError } = await supabase
    .from('listing_images')
    .delete()
    .eq('listing_id', listingId)
  
  if (deleteError) throw deleteError
  
  // Then insert new images
  if (images && images.length > 0) {
    const imageRecords = images.map((url, index) => ({
      listing_id: listingId,
      url: url,
      position: index
    }))
    
    const { error: insertError } = await supabase
      .from('listing_images')
      .insert(imageRecords)
    
    if (insertError) throw insertError
  }
  
  return { data: images }
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