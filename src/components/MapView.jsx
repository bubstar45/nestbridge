'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function MapView({ listings }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const router = useRouter()

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return
    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css')
      const map = L.map(mapRef.current).setView([39.5, -98.35], 4)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      listings.forEach(l => {
        if (!l.lat || !l.lng) return
        L.marker([l.lat, l.lng])
          .addTo(map)
          .bindPopup(`<b>${l.title}</b><br>$${l.price}/mo<br>
            <a href="/listings/${l.id}">View details →</a>`)
      })
      mapInstance.current = map
    })
  }, [listings])

  return (
    <div ref={mapRef}
      style={{ height: '70vh', borderRadius: '12px', overflow: 'hidden' }}
    />
  )
}