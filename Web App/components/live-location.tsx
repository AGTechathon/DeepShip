"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { User } from "firebase/auth"
import { ref, set, onValue } from "firebase/database"
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { database, firestore } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Play, Square, Navigation, Clock, Satellite } from "lucide-react"
import { toast } from "sonner"

// Dynamically import the map component to avoid SSR issues
const LocationMap = dynamic(() => import("@/components/location-map"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
})

interface LiveLocationProps {
  user: User
}

interface LocationData {
  lat: number | null
  lng: number | null
  lastUpdated: string | null
}

interface LocationHistoryItem {
  id?: string
  lat: number
  lng: number
  timestamp: string
  address?: string
}

export default function LiveLocation({ user }: LiveLocationProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [location, setLocation] = useState<LocationData>({
    lat: 17.613409, // Default coordinates
    lng: 75.891103,
    lastUpdated: "6/14/2025, 5:55:59 PM",
  })
  const [watchId, setWatchId] = useState<number | null>(null)
  const [locationHistory, setLocationHistory] = useState<LocationHistoryItem[]>([])
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  useEffect(() => {
    // Listen to location updates from Firebase
    const locationRef = ref(database, `users/${user.uid}/liveLocation`)
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setLocation(data)
      }
    })

    return () => unsubscribe()
  }, [user.uid])

  // Load location history from Firestore
  useEffect(() => {
    if (!user?.uid) return

    const historyRef = collection(firestore, `users/${user.uid}/locationHistory`)
    const historyQuery = query(historyRef, orderBy("timestamp", "desc"), limit(10))

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const history: LocationHistoryItem[] = []
      snapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as LocationHistoryItem)
      })
      setLocationHistory(history)
    })

    return () => unsubscribe()
  }, [user?.uid])

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support location tracking.",
      })
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }

    const success = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords
      const locationData = {
        lat: latitude,
        lng: longitude,
        lastUpdated: new Date().toISOString(),
      }

      // Update Firebase
      const locationRef = ref(database, `users/${user.uid}/liveLocation`)
      set(locationRef, locationData)

      setLocation(locationData)
    }

    const error = (err: GeolocationPositionError) => {
      console.error("Error getting location:", err)
      toast.error("Location tracking error", {
        description: "Please check your permissions and try again.",
      })
    }

    const id = navigator.geolocation.watchPosition(success, error, options)
    setWatchId(id)
    setIsTracking(true)
    toast.success("Location tracking started", {
      description: "Your location will be updated automatically.",
    })
  }

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)
    toast.info("Location tracking stopped", {
      description: "Automatic location updates have been disabled.",
    })
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support location tracking.",
      })
      return
    }

    setIsGettingLocation(true)

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    const success = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords
      const timestamp = new Date().toISOString()

      const locationData = {
        lat: latitude,
        lng: longitude,
        lastUpdated: timestamp,
      }

      try {
        // Update current location in Realtime Database
        const locationRef = ref(database, `users/${user.uid}/liveLocation`)
        await set(locationRef, locationData)

        // Store in Firestore for history
        const historyRef = collection(firestore, `users/${user.uid}/locationHistory`)
        await addDoc(historyRef, {
          lat: latitude,
          lng: longitude,
          timestamp: timestamp,
          address: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        })

        setLocation(locationData)
        setIsGettingLocation(false)

        // Show success message
        toast.success("Location saved successfully!", {
          description: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        })

      } catch (error) {
        console.error("Error saving location:", error)
        toast.error("Error saving location", {
          description: "Please try again. Check your internet connection.",
        })
        setIsGettingLocation(false)
      }
    }

    const error = (err: GeolocationPositionError) => {
      console.error("Error getting location:", err)
      setIsGettingLocation(false)

      let errorMessage = "Error getting your location"
      let description = ""
      switch (err.code) {
        case err.PERMISSION_DENIED:
          description = "Please allow location access and try again."
          break
        case err.POSITION_UNAVAILABLE:
          description = "Location information is unavailable."
          break
        case err.TIMEOUT:
          description = "Location request timed out."
          break
        default:
          description = "An unknown error occurred."
          break
      }
      toast.error(errorMessage, { description })
    }

    navigator.geolocation.getCurrentPosition(success, error, options)
  }

  const formatCoordinate = (coord: number | null) => {
    return coord ? coord.toFixed(6) : "N/A"
  }

  const formatLastUpdated = (timestamp: string | null) => {
    if (!timestamp) return "Never"
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Live Location Tracking</h2>
          <p className="text-gray-600">Monitor your real-time location</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isTracking ? "default" : "secondary"} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isTracking ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            {isTracking ? "Tracking Active" : "Tracking Inactive"}
          </Badge>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Location Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {!isTracking ? (
              <Button
                onClick={startTracking}
                className="bg-gradient-to-r from-green-600 to-blue-600 flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Tracking
              </Button>
            ) : (
              <Button onClick={stopTracking} variant="destructive" className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                Stop Tracking
              </Button>
            )}
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isGettingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  Getting Location...
                </>
              ) : (
                <>
                  <Satellite className="h-4 w-4" />
                  Get Current Location
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Location Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Latitude</p>
                <p className="text-lg font-bold">{formatCoordinate(location.lat)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Longitude</p>
                <p className="text-lg font-bold">{formatCoordinate(location.lng)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-sm font-semibold">{formatLastUpdated(location.lastUpdated)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          {location.lat && location.lng ? (
            <LocationMap
              latitude={location.lat}
              longitude={location.lng}
              lastUpdated={location.lastUpdated}
            />
          ) : (
            <div className="h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Location Data</h3>
                <p className="text-gray-500 mb-4">Start tracking to see your location on the map</p>
                <Button onClick={startTracking} className="bg-gradient-to-r from-purple-600 to-blue-600">
                  <Play className="h-4 w-4 mr-2" />
                  Start Location Tracking
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Location History</span>
            {locationHistory.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {locationHistory.length} saved
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {locationHistory.length > 0 ? (
              locationHistory.map((historyItem, index) => (
                <div key={historyItem.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {index === 0 ? "Latest Location" : `Location ${index + 1}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {historyItem.lat.toFixed(6)}, {historyItem.lng.toFixed(6)}
                      </p>
                      {historyItem.address && (
                        <p className="text-xs text-gray-500">{historyItem.address}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatLastUpdated(historyItem.timestamp)}
                    </p>
                    <Badge variant={index === 0 ? "default" : "secondary"} className="mt-1">
                      {index === 0 ? "Latest" : "Saved"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No location history available</p>
                <p className="text-sm text-gray-500">Click "Get Current Location" to start building your location history</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
