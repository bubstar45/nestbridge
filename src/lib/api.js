import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Listings
export const getListings = async (params = {}) => {
  let query = supabase.from('listings').select('*').eq('is_active', true)
  if (params.city) query = query.ilike('city', `%${params.city}%`)
  if (params.type) query = query.eq('type', params.type)
  if (params.mode) query = query.eq('listing_mode', params.mode)
  if (params.limit) query = query.limit(params.limit)
  const { data, error } = await query
  if (error) throw error
  return { data: { listings: data } }
}

export const getListing = async (id) => {
  const { data, error } = await supabase.from('listings').select('*').eq('id', id).single()
  if (error) throw error
  return { data }
}

// NEW: Get images for a listing
export const getListingImages = async (listingId) => {
  const { data, error } = await supabase
    .from('listings')
    .select('images')
    .eq('id', listingId)
    .single()
  if (error) throw error
  return { data: data?.images || [] }
}

// NEW: Update images for a listing
export const updateListingImages = async (listingId, images) => {
  const { data, error } = await supabase
    .from('listings')
    .update({ images })
    .eq('id', listingId)
    .select()
    .single()
  if (error) throw error
  return { data }
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
  const { data, error } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return { data }
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
  const { data, error } = await supabase
    .from('listings')
    .update({ images })
    .eq('id', listingId)
    .select()
    .single()
  if (error) throw error
  return { data }
}

export default supabase