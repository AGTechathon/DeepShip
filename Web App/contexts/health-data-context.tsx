"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import type { User } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { ref, onValue } from "firebase/database"
import { firestore, database } from "@/lib/firebase"

interface HealthData {
  // Steps data
  fitSteps: number | null
  dailySteps: number
  
  // Heart rate data
  fitHeartRate: number | null
  currentHeartRate: number
  dynamicHeartRate: number
  heartRateStats: {
    average: number
    minimum: number
    maximum: number
  }
  
  // Bluetooth status
  bluetoothStatus: boolean | null
  
  // Location data with address
  location: {
    lat: number | null
    lng: number | null
    lastUpdated: string | null
    address: string | null
    city: string | null
    state: string | null
    country: string | null
  }
}

interface HealthDataContextType {
  healthData: HealthData
  updateHealthData: (data: Partial<HealthData>) => void
  isLoading: boolean
}

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined)

export const useHealthData = () => {
  const context = useContext(HealthDataContext)
  if (context === undefined) {
    throw new Error("useHealthData must be used within a HealthDataProvider")
  }
  return context
}

interface HealthDataProviderProps {
  children: React.ReactNode
  user: User | null
  googleFitToken: string | null
}

export const HealthDataProvider: React.FC<HealthDataProviderProps> = ({
  children,
  user,
  googleFitToken
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [healthData, setHealthData] = useState<HealthData>({
    fitSteps: null,
    dailySteps: 8420, // Default fallback
    fitHeartRate: null,
    currentHeartRate: 78,
    dynamicHeartRate: 78,
    heartRateStats: {
      average: 78,
      minimum: 65,
      maximum: 95
    },
    bluetoothStatus: null,
    location: {
      lat: null,
      lng: null,
      lastUpdated: null,
      address: null,
      city: null,
      state: null,
      country: null
    }
  })

  // Function to reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Add error handling for missing API key
      if (!process.env.NEXT_PUBLIC_OPENCAGE_API_KEY) {
        console.warn("OpenCage API key not found, using Nominatim fallback")
        throw new Error("No OpenCage API key")
      }

      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
      )
      
      if (!response.ok) {
        // Fallback to Nominatim if OpenCage fails
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        )
        
        if (nominatimResponse.ok) {
          const data = await nominatimResponse.json()
          return {
            address: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            city: data.address?.city || data.address?.town || data.address?.village || "Unknown",
            state: data.address?.state || data.address?.region || "Unknown",
            country: data.address?.country || "Unknown"
          }
        }
        
        throw new Error("Geocoding failed")
      }
      
      const data = await response.json()
      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        return {
          address: result.formatted || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          city: result.components?.city || result.components?.town || result.components?.village || "Unknown",
          state: result.components?.state || result.components?.region || "Unknown",
          country: result.components?.country || "Unknown"
        }
      }
      
      throw new Error("No results found")
    } catch (error) {
      console.error("Geocoding error:", error)
      return {
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        city: "Unknown",
        state: "Unknown", 
        country: "Unknown"
      }
    }
  }

  // Listen to location updates from Firebase
  useEffect(() => {
    if (!user?.uid) return

    const locationRef = ref(database, `users/${user.uid}/liveLocation`)
    const unsubscribe = onValue(locationRef, async (snapshot) => {
      const data = snapshot.val()
      if (data && data.lat && data.lng) {
        // Get address from coordinates
        const addressData = await reverseGeocode(data.lat, data.lng)
        
        setHealthData(prev => ({
          ...prev,
          location: {
            lat: data.lat,
            lng: data.lng,
            lastUpdated: data.lastUpdated,
            ...addressData
          }
        }))
      }
    })

    return () => unsubscribe()
  }, [user?.uid])

  // Bluetooth status is now managed locally in Dashboard component
  // This context focuses on health metrics only

  // Fetch Google Fit data
  useEffect(() => {
    if (!googleFitToken) {
      setIsLoading(false)
      return
    }

    const fetchGoogleFitData = async () => {
      try {
        console.log('Fetching Google Fit data for Health Context...')
        const now = Date.now()
        const oneDayAgo = now - 24 * 60 * 60 * 1000
        const url = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate'
        const body = {
          aggregateBy: [
            { dataTypeName: 'com.google.step_count.delta' },
            { dataTypeName: 'com.google.heart_rate.bpm' }
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: oneDayAgo,
          endTimeMillis: now
        }
        
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleFitToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })

        if (!res.ok) {
          throw new Error(`Google Fit API Error: ${res.status} ${res.statusText}`)
        }

        const data = await res.json()
        
        // Parse steps
        const steps = data.bucket?.[0]?.dataset?.find((ds: any) => 
          ds.dataSourceId?.includes('step_count')
        )?.point?.[0]?.value?.[0]?.intVal
        
        // Parse heart rate (average)
        const heartPoints = data.bucket?.[0]?.dataset?.find((ds: any) => 
          ds.dataSourceId?.includes('heart_rate')
        )?.point
        
        let avgHeart = null
        if (heartPoints && heartPoints.length > 0) {
          const sum = heartPoints.reduce((acc: number, pt: any) => 
            acc + (pt.value?.[0]?.fpVal || 0), 0
          )
          avgHeart = Math.round(sum / heartPoints.length)
        }
        
        setHealthData(prev => ({
          ...prev,
          fitSteps: steps || 0,
          dailySteps: steps || prev.dailySteps,
          fitHeartRate: avgHeart,
          currentHeartRate: avgHeart || prev.currentHeartRate
        }))

      } catch (error) {
        console.error('Error fetching Google Fit data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGoogleFitData()
  }, [googleFitToken])

  const updateHealthData = (data: Partial<HealthData>) => {
    setHealthData(prev => ({ ...prev, ...data }))
  }

  const value = {
    healthData,
    updateHealthData,
    isLoading
  }

  return (
    <HealthDataContext.Provider value={value}>
      {children}
    </HealthDataContext.Provider>
  )
}
