"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Custom marker icon for user location
const createCustomIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          width: 40px;
          height: 40px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          position: absolute;
          top: -10px;
          left: -10px;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      </style>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

interface LocationMapProps {
  latitude: number
  longitude: number
  lastUpdated: string | null
}

// Component to handle map centering
function MapController({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView([latitude, longitude], 15)
  }, [map, latitude, longitude])
  
  return null
}

export default function LocationMap({ latitude, longitude, lastUpdated }: LocationMapProps) {
  const formatLastUpdated = (timestamp: string | null) => {
    if (!timestamp) return "Never"
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6)
  }

  return (
    <div className="h-96 rounded-lg overflow-hidden border">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker 
          position={[latitude, longitude]} 
          icon={createCustomIcon()}
        >
          <Popup>
            <div className="text-center p-2">
              <h3 className="font-semibold mb-2">Your Location</h3>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Lat:</strong> {formatCoordinate(latitude)}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Lng:</strong> {formatCoordinate(longitude)}
              </p>
              <p className="text-xs text-gray-500">
                Updated: {formatLastUpdated(lastUpdated)}
              </p>
            </div>
          </Popup>
        </Marker>
        
        <MapController latitude={latitude} longitude={longitude} />
      </MapContainer>
    </div>
  )
}
