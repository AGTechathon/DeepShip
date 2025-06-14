"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Smaller custom marker icon for dashboard preview
const createCompactIcon = () => {
  return L.divIcon({
    className: "compact-marker",
    html: `
      <div style="
        width: 12px;
        height: 12px;
        background: #3b82f6;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

interface CompactLocationMapProps {
  latitude: number
  longitude: number
}

// Component to handle map centering
function MapController({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView([latitude, longitude], 13)
  }, [map, latitude, longitude])
  
  return null
}

export default function CompactLocationMap({ latitude, longitude }: CompactLocationMapProps) {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker 
          position={[latitude, longitude]} 
          icon={createCompactIcon()}
        />
        
        <MapController latitude={latitude} longitude={longitude} />
      </MapContainer>
    </div>
  )
}
