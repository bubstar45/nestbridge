import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
  const { data, error } = await supabaseAdmin
    .from('listing_images')
    .select('*')
    .eq('listing_id', params.id)
    .order('position')

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }) {
  const { images } = await req.json()

  // Delete old images first
  await supabaseAdmin.from('listing_images').delete().eq('listing_id', params.id)

  // Insert new ones
  const rows = images.map((img, i) => ({
    listing_id: params.id,
    url: img.url,
    position: i
  }))

  const { error } = await supabaseAdmin.from('listing_images').insert(rows)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ success: true })
}