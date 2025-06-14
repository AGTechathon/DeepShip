"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { User } from "firebase/auth"
import { ref, set, onValue } from "firebase/database"
import { database } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Play, Square, Navigation, Clock, Satellite } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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

export default function LiveLocation({ user }: LiveLocationProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [location, setLocation] = useState<LocationData>({
    lat: 17.613409, // Default coordinates
    lng: 75.891103,
    lastUpdated: "6/14/2025, 5:55:59 PM",
  })
  const [watchId, setWatchId] = useState<number | null>(null)

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

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.")
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
      alert("Error getting your location. Please check your permissions.")
    }

    const id = navigator.geolocation.watchPosition(success, error, options)
    setWatchId(id)
    setIsTracking(true)
  }

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)
  }

  const formatCoordinate = (coord: number | null) => {
    return coord ? coord.toFixed(6) : "N/A"
  }

  const formatLastUpdated = (timestamp: string | null) => {
    if (!timestamp) return "Never"
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  const statsCardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4
      }
    }
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex justify-between items-center"
        variants={cardVariants}
      >
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold">Live Location Tracking</h2>
          <p className="text-gray-600">Monitor your real-time location</p>
        </motion.div>
        <motion.div
          className="flex items-center gap-2"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            animate={isTracking ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Badge variant={isTracking ? "default" : "secondary"} className="flex items-center gap-1">
              <motion.div
                className={`w-2 h-2 rounded-full ${isTracking ? "bg-green-500" : "bg-gray-400"}`}
                animate={isTracking ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {isTracking ? "Tracking Active" : "Tracking Inactive"}
            </Badge>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Control Panel */}
      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.01 }}
      >
        <Card>
          <CardHeader>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <CardTitle className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Navigation className="h-5 w-5" />
                </motion.div>
                Location Controls
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <AnimatePresence mode="wait">
                {!isTracking ? (
                  <motion.div
                    key="start-button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={startTracking}
                      className="bg-gradient-to-r from-green-600 to-blue-600 flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Start Tracking
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="stop-button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button onClick={stopTracking} variant="destructive" className="flex items-center gap-2">
                      <Square className="h-4 w-4" />
                      Stop Tracking
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" className="flex items-center gap-2">
                  <Satellite className="h-4 w-4" />
                  Get Current Location
                </Button>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Location Info */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={containerVariants}
      >
        <motion.div
          variants={statsCardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-blue-100 rounded-full"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <MapPin className="h-5 w-5 text-blue-600" />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-600">Latitude</p>
                  <motion.p
                    className="text-lg font-bold"
                    key={location.lat}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {formatCoordinate(location.lat)}
                  </motion.p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={statsCardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-green-100 rounded-full"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <MapPin className="h-5 w-5 text-green-600" />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-600">Longitude</p>
                  <motion.p
                    className="text-lg font-bold"
                    key={location.lng}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {formatCoordinate(location.lng)}
                  </motion.p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={statsCardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-purple-100 rounded-full"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Clock className="h-5 w-5 text-purple-600" />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <motion.p
                    className="text-sm font-semibold"
                    key={location.lastUpdated}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {formatLastUpdated(location.lastUpdated)}
                  </motion.p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Map Display */}
      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.01 }}
      >
        <Card>
          <CardHeader>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <CardTitle className="flex items-center gap-2">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <MapPin className="h-5 w-5" />
                </motion.div>
                Location Map
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {location.lat && location.lng ? (
                <motion.div
                  key="map-active"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                >
                  <LocationMap
                    latitude={location.lat}
                    longitude={location.lng}
                    lastUpdated={location.lastUpdated}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="map-placeholder"
                  className="h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div
                    className="text-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Location Data</h3>
                    <p className="text-gray-500 mb-4">Start tracking to see your location on the map</p>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button onClick={startTracking} className="bg-gradient-to-r from-purple-600 to-blue-600">
                        <Play className="h-4 w-4 mr-2" />
                        Start Location Tracking
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Location History */}
      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.01 }}
      >
        <Card>
          <CardHeader>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <CardTitle>Location History</CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.div
              className="space-y-3"
              variants={containerVariants}
            >
              <AnimatePresence mode="wait">
                {location.lastUpdated ? (
                  <motion.div
                    key="history-active"
                    className="flex items-center justify-between p-4 border rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="p-2 bg-blue-100 rounded-full"
                        animate={isTracking ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </motion.div>
                      <div>
                        <p className="font-semibold">Current Location</p>
                        <motion.p
                          className="text-sm text-gray-600"
                          key={`${location.lat}-${location.lng}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          {formatCoordinate(location.lat)}, {formatCoordinate(location.lng)}
                        </motion.p>
                      </div>
                    </div>
                    <div className="text-right">
                      <motion.p
                        className="text-sm text-gray-500"
                        key={location.lastUpdated}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        {formatLastUpdated(location.lastUpdated)}
                      </motion.p>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Badge variant="secondary" className="mt-1">
                          Active
                        </Badge>
                      </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="history-empty"
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-gray-600">No location history available</p>
                    <p className="text-sm text-gray-500">Start tracking to build your location history</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
