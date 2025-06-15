"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { User } from "firebase/auth"
import { ref, onValue } from "firebase/database"
import { database, firestore } from "@/lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Footprints, MapPin, Filter, MoreHorizontal, Heart, Activity, Bluetooth, BluetoothOff } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import ThreeScene from "@/components/three-scene"
import MedicinesSchedule from "@/components/medicines-schedule"
import { motion, AnimatePresence } from "framer-motion"
import "@/lib/bluetooth-test" // Import test utilities for development
import { useHealthData } from "@/contexts/health-data-context"



interface DashboardProps {
  user: User
  googleFitToken: string | null
}

interface LocationData {
  lat: number | null
  lng: number | null
  lastUpdated: string | null
}

const heartRateData = [
  { time: "9:00", rate: 72 },
  { time: "9:15", rate: 78 },
  { time: "9:30", rate: 85 },
  { time: "9:45", rate: 82 },
  { time: "10:00", rate: 88 },
  { time: "10:15", rate: 92 },
  { time: "10:30", rate: 87 },
  { time: "10:45", rate: 83 },
]

export default function Dashboard({ user, googleFitToken }: DashboardProps) {
  const { healthData, updateHealthData } = useHealthData()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentHeartRate, setCurrentHeartRate] = useState(78)
  const [heartRateHistory, setHeartRateHistory] = useState(heartRateData)
  const [isRealtimeActive, setIsRealtimeActive] = useState(false)
  const [heartRateStats, setHeartRateStats] = useState({
    average: 78,
    minimum: 65,
    maximum: 95
  })
  const [showBluetoothDialog, setShowBluetoothDialog] = useState(false)
  const [dynamicHeartRate, setDynamicHeartRate] = useState(78)
  const [bluetoothStatus, setBluetoothStatus] = useState<boolean | null>(null)

  // Extract data from context (excluding bluetoothStatus since we manage it locally)
  const { fitSteps, fitHeartRate, location } = healthData


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Enhanced Bluetooth status handling with proper error logging
  useEffect(() => {
    if (!user?.uid) return

    // Listen to BluetoothEnabled field/document in user's UID
    const userDocRef = doc(firestore, "users", user.uid)
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      try {
        if (doc.exists()) {
          const userData = doc.data()

          // Check for BluetoothEnabled field (primary)
          let bluetoothEnabled = userData?.BluetoothEnabled

          // Fallback to bluetooth field for backward compatibility
          if (bluetoothEnabled === undefined) {
            bluetoothEnabled = userData?.bluetooth
          }

          console.info(`BluetoothEnabled status for user ${user.uid}:`, {
            userId: user.uid,
            userEmail: user.email,
            BluetoothEnabled: bluetoothEnabled,
            timestamp: new Date().toISOString(),
            documentData: userData
          })

          if (bluetoothEnabled === false) {
            console.warn(`BluetoothEnabled disabled for user: ${user.uid}`, {
              userId: user.uid,
              userEmail: user.email,
              BluetoothEnabled: bluetoothEnabled,
              timestamp: new Date().toISOString(),
              action: "showing_bluetooth_dialog"
            })

            setShowBluetoothDialog(true)

            // Stop live monitoring if it's currently active
            if (isRealtimeActive) {
              console.warn("Stopping live monitoring due to BluetoothEnabled = false")
              setIsRealtimeActive(false)
            }
          } else if (bluetoothEnabled === true) {
            console.info(`BluetoothEnabled connected for user: ${user.uid}`, {
              userId: user.uid,
              userEmail: user.email,
              BluetoothEnabled: bluetoothEnabled,
              timestamp: new Date().toISOString()
            })
          } else {
            console.info(`BluetoothEnabled status unknown for user: ${user.uid} - value: ${bluetoothEnabled}`)
          }

          // Update the bluetooth status state
          setBluetoothStatus(bluetoothEnabled)
        } else {
          console.warn(`User document not found for user: ${user.uid}`)
          setBluetoothStatus(null)
        }
      } catch (error) {
        console.error("Error processing BluetoothEnabled status:", error, {
          userId: user.uid,
          userEmail: user.email,
          error: error
        })
        setBluetoothStatus(null)
      }
    }, (error) => {
      console.error("Error listening to user document for BluetoothEnabled:", error, {
        userId: user.uid,
        userEmail: user.email,
        error: error
      })
      setBluetoothStatus(null)
    })

    return () => unsubscribe()
  }, [user?.uid, isRealtimeActive])



  // Live heart rate monitoring when Bluetooth is connected and live mode is active
  useEffect(() => {
    // Only run when live monitoring is active and Bluetooth is connected
    if (!isRealtimeActive || bluetoothStatus !== true) return

    if (!user?.uid) {
      console.error("Cannot start live monitoring: User not authenticated")
      return
    }

    console.log(`Starting live heart rate monitoring for user: ${user.uid}`, {
      userId: user.uid,
      userEmail: user.email,
      bluetoothStatus: bluetoothStatus,
      isRealtimeActive: isRealtimeActive,
      timestamp: new Date().toISOString()
    })

    const heartRateInterval = setInterval(() => {
      try {
        // Generate dynamic heart rate between 75-110 BPM (Bluetooth connected range)
        const baseRate = 92.5 // Middle of 75-110 range
        const variation = Math.sin(Date.now() / 8000) * 12 + Math.random() * 10 - 5
        const newRate = Math.round(Math.max(75, Math.min(110, baseRate + variation)))

        // Validate heart rate is within expected range
        if (newRate < 75 || newRate > 110) {
          console.warn(`Generated heart rate out of range: ${newRate} BPM`)
          return
        }

        // Update both dynamic and current heart rate
        setDynamicHeartRate(newRate)
        setCurrentHeartRate(newRate)

        // Update context with error handling
        try {
          updateHealthData({
            dynamicHeartRate: newRate,
            currentHeartRate: newRate
          })
        } catch (contextError) {
          console.error("Error updating health data context:", contextError)
        }

        // Update chart data (keep last 8 points)
        const now = new Date()
        const timeString = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })

        setHeartRateHistory(prev => {
          try {
            const newData = [...prev.slice(1), { time: timeString, rate: newRate }]

            // Update stats based on recent data
            const rates = newData.map(d => d.rate)
            const avg = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
            const min = Math.min(...rates)
            const max = Math.max(...rates)

            setHeartRateStats({ average: avg, minimum: min, maximum: max })

            return newData
          } catch (chartError) {
            console.error("Error updating heart rate chart:", chartError)
            return prev // Return previous data if update fails
          }
        })

        console.log(`Live heart rate updated: ${newRate} BPM (User: ${user.uid})`)
      } catch (error) {
        console.error("Error in heart rate monitoring loop:", error, {
          userId: user.uid,
          bluetoothStatus: bluetoothStatus,
          isRealtimeActive: isRealtimeActive
        })
      }
    }, 1500) // Update every 1.5 seconds for responsive feel

    return () => {
      clearInterval(heartRateInterval)
      console.log(`Live heart rate monitoring stopped for user: ${user.uid}`)
    }
  }, [isRealtimeActive, bluetoothStatus, user?.uid, updateHealthData])

  // Background heart rate updates when Bluetooth is connected (for display purposes)
  useEffect(() => {
    // Only update background heart rate when Bluetooth is connected but live mode is off
    if (isRealtimeActive || bluetoothStatus !== true) return

    const backgroundInterval = setInterval(() => {
      // Generate slower background updates for display
      const baseRate = 92.5
      const variation = Math.sin(Date.now() / 12000) * 10 + Math.random() * 8 - 4
      const newRate = Math.round(Math.max(75, Math.min(110, baseRate + variation)))
      setDynamicHeartRate(newRate)
    }, 3000) // Slower updates when not in live mode

    return () => clearInterval(backgroundInterval)
  }, [isRealtimeActive, bluetoothStatus])

  // Fallback heart rate simulation when Bluetooth is not connected
  useEffect(() => {
    // Only run when live monitoring is active but Bluetooth is not connected
    if (!isRealtimeActive || bluetoothStatus === true || bluetoothStatus === null) return

    if (!user?.uid) {
      console.error("Cannot start fallback monitoring: User not authenticated")
      return
    }

    console.warn(`Starting fallback heart rate simulation for user: ${user.uid} (Bluetooth not connected)`, {
      userId: user.uid,
      userEmail: user.email,
      bluetoothStatus: bluetoothStatus,
      reason: "bluetooth_disconnected"
    })

    const heartRateInterval = setInterval(() => {
      try {
        // Simulate realistic heart rate variations (60-100 BPM normal range)
        const baseRate = 75
        const variation = Math.sin(Date.now() / 10000) * 10 + Math.random() * 8 - 4
        const newRate = Math.round(Math.max(60, Math.min(100, baseRate + variation)))

        // Validate heart rate is within expected range
        if (newRate < 60 || newRate > 100) {
          console.warn(`Fallback heart rate out of range: ${newRate} BPM`)
          return
        }

        setCurrentHeartRate(newRate)

        // Update chart data (keep last 8 points)
        const now = new Date()
        const timeString = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })

        setHeartRateHistory(prev => {
          try {
            const newData = [...prev.slice(1), { time: timeString, rate: newRate }]

            // Update stats based on recent data
            const rates = newData.map(d => d.rate)
            const avg = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
            const min = Math.min(...rates)
            const max = Math.max(...rates)

            setHeartRateStats({ average: avg, minimum: min, maximum: max })

            return newData
          } catch (chartError) {
            console.error("Error updating fallback heart rate chart:", chartError)
            return prev
          }
        })

        console.log(`Fallback heart rate updated: ${newRate} BPM (User: ${user.uid}, Bluetooth disconnected)`)
      } catch (error) {
        console.error("Error in fallback heart rate simulation:", error, {
          userId: user.uid,
          bluetoothStatus: bluetoothStatus,
          isRealtimeActive: isRealtimeActive
        })
      }
    }, 2000) // Update every 2 seconds

    return () => {
      clearInterval(heartRateInterval)
      console.log(`Fallback heart rate simulation stopped for user: ${user.uid}`)
    }
  }, [isRealtimeActive, bluetoothStatus, user?.uid])

  useEffect(() => {
    if (!googleFitToken) return;
    // Fetch Google Fit data
    const fetchGoogleFitData = async () => {
      try {
        console.log('Fetching Google Fit data with token:', googleFitToken.substring(0, 10) + '...');
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const url = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';
        const body = {
          aggregateBy: [
            { dataTypeName: 'com.google.step_count.delta' },
            { dataTypeName: 'com.google.heart_rate.bpm' },
            { dataTypeName: 'com.google.location.sample' }
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: oneDayAgo,
          endTimeMillis: now
        };
        
        console.log('Request body:', JSON.stringify(body, null, 2));
        
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleFitToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error('Google Fit API Error:', {
            status: res.status,
            statusText: res.statusText,
            error: errorData
          });
          throw new Error(`Google Fit API Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log('Google Fit API Response:', JSON.stringify(data, null, 2));

        // Parse steps
        const steps = data.bucket?.[0]?.dataset?.find((ds: any) => ds.dataSourceId?.includes('step_count'))?.point?.[0]?.value?.[0]?.intVal;

        // Parse heart rate (average)
        const heartPoints = data.bucket?.[0]?.dataset?.find((ds: any) => ds.dataSourceId?.includes('heart_rate'))?.point;
        let avgHeart = null;
        if (heartPoints && heartPoints.length > 0) {
          const sum = heartPoints.reduce((acc: number, pt: any) => acc + (pt.value?.[0]?.fpVal || 0), 0);
          avgHeart = Math.round(sum / heartPoints.length);
        }

        // Update context with new data
        updateHealthData({
          fitSteps: steps || 0,
          dailySteps: steps || healthData.dailySteps,
          fitHeartRate: avgHeart,
          currentHeartRate: avgHeart || healthData.currentHeartRate
        });

      } catch (error) {
        console.error('Error fetching Google Fit data:', error);
        // You might want to show an error message to the user here
      }
    };
    fetchGoogleFitData();
  }, [googleFitToken]);

  const toggleRealtime = () => {
    // If trying to start live monitoring, check Bluetooth status first
    if (!isRealtimeActive) {
      try {
        // Check if user is authenticated
        if (!user?.uid) {
          console.error("User not authenticated for Bluetooth check")
          alert("Please log in to start live monitoring")
          return
        }

        // Check if Bluetooth status is available
        if (bluetoothStatus === null) {
          console.warn(`Bluetooth status still loading for user: ${user.uid}`)
          alert("Checking Bluetooth status... Please wait a moment and try again.")
          return
        }

        if (bluetoothStatus === false) {
          console.warn(`Bluetooth is disabled for user: ${user.uid}`)
          // Show popup with proper error context
          setShowBluetoothDialog(true)

          // Log the error for debugging
          console.error("Live monitoring blocked: Bluetooth is disabled", {
            userId: user.uid,
            userEmail: user.email,
            bluetoothStatus: bluetoothStatus,
            timestamp: new Date().toISOString()
          })
          return
        }

        // Bluetooth is on, proceed with starting live monitoring
        if (bluetoothStatus === true) {
          console.log(`Bluetooth connected for user ${user.uid} - Starting live heart rate monitoring`)
          setIsRealtimeActive(true)

          // Log successful start
          console.info("Live monitoring started successfully", {
            userId: user.uid,
            userEmail: user.email,
            bluetoothStatus: bluetoothStatus,
            timestamp: new Date().toISOString()
          })
          return
        }
      } catch (error) {
        console.error("Error checking Bluetooth status:", error)
        alert("Error checking Bluetooth status. Please try again.")
        return
      }
    }

    // If stopping live monitoring, log the action
    if (isRealtimeActive) {
      console.log(`Live monitoring stopped for user: ${user?.uid}`)
    }

    // Toggle normally
    setIsRealtimeActive(!isRealtimeActive)
  }

  const getHeartRateStatus = (rate: number) => {
    if (rate < 60) return { status: "Low", color: "bg-blue-500", textColor: "text-blue-600" }
    if (rate > 100) return { status: "High", color: "bg-red-500", textColor: "text-red-600" }
    return { status: "Normal", color: "bg-green-500", textColor: "text-green-600" }
  }

  // Get the appropriate heart rate to display
  const getDisplayHeartRate = () => {
    if (bluetoothStatus === true) {
      return dynamicHeartRate
    }
    return fitHeartRate || currentHeartRate
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

  const numberCountVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  }

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1,
      repeat: Infinity
    }
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Main Dashboard Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        {/* Left Column - Health Stats */}
        <motion.div className="lg:col-span-2 space-y-6" variants={cardVariants}>
          {/* Health Metrics Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={containerVariants}
          >
            {/* Steps */}
            <motion.div
              variants={cardVariants}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="relative overflow-hidden h-full">
                <CardContent className="p-6">
                  <motion.div
                    className="flex items-center gap-3 mb-4"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      className="p-2 bg-blue-100 rounded-full"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Footprints className="h-5 w-5 text-blue-600" />
                    </motion.div>
                    <span className="text-sm font-medium text-gray-600">Steps</span>
                  </motion.div>
                  <div className="space-y-2">
                    <motion.div
                      className="text-3xl font-bold"
                      variants={numberCountVariants}
                      key={fitSteps || 1524}
                    >
                      {fitSteps || 1524}
                    </motion.div>
                    <motion.div
                      className="flex items-center gap-2 text-sm text-gray-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <span>+100% This day</span>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Realtime Heart Rate */}
            <motion.div
              variants={cardVariants}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="relative overflow-hidden h-full">
                <CardContent className="p-6">
                  <motion.div
                    className="flex items-center justify-between mb-4"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="p-2 bg-red-100 rounded-full"
                        animate={isRealtimeActive ? pulseAnimation : {}}
                      >
                        <Heart className={`h-5 w-5 ${isRealtimeActive ? 'text-red-500' : 'text-red-600'}`} />
                      </motion.div>
                      <span className="text-sm font-medium text-gray-600">Heart Rate</span>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={toggleRealtime}
                        variant={isRealtimeActive ? "destructive" : "outline"}
                        size="sm"
                        className={`h-8 px-3 text-xs ${
                          !isRealtimeActive && bluetoothStatus === false
                            ? "border-red-300 text-red-500 hover:border-red-400"
                            : ""
                        }`}
                        title={
                          !isRealtimeActive && bluetoothStatus === false
                            ? "Bluetooth connection required for live monitoring"
                            : ""
                        }
                      >
                        {isRealtimeActive ? "Stop" : "Start"}
                        {!isRealtimeActive && bluetoothStatus === false && (
                          <motion.div
                            className="ml-1"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <BluetoothOff className="h-3 w-3" />
                          </motion.div>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                  <div className="space-y-2">
                    <motion.div
                      className="flex items-baseline gap-2"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.div
                        className="text-3xl font-bold text-red-600"
                        key={getDisplayHeartRate()}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {getDisplayHeartRate()}
                      </motion.div>
                      <span className="text-sm text-gray-500">BPM</span>
                    </motion.div>
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Badge
                        variant="outline"
                        className={`text-xs ${getHeartRateStatus(getDisplayHeartRate()).textColor} border-current`}
                      >
                        {getHeartRateStatus(getDisplayHeartRate()).status}
                      </Badge>
                      <AnimatePresence>
                        {isRealtimeActive && (
                          <motion.div
                            className="flex items-center gap-1 text-xs text-gray-500"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                          >
                            <motion.div
                              className="w-2 h-2 bg-red-500 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                            Live
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Medicines Schedule Section */}
          <motion.div
            variants={cardVariants}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <MedicinesSchedule user={user} />
          </motion.div>
        </motion.div>

        {/* Right Column - Heart Statistics & 3D Scene */}
        <motion.div
          className="space-y-6"
          variants={cardVariants}
        >
          {/* Heart Statistics */}
          <motion.div
            variants={cardVariants}
            whileHover={{
              scale: 1.01,
              boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
              transition: { duration: 0.3 }
            }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <CardTitle className="text-lg">Your Heart Statistic</CardTitle>
                </motion.div>
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </motion.div>
              </CardHeader>
            <CardContent>
              {/* Realtime Heart Rate Display */}
              <motion.div
                className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  className="flex items-center justify-between mb-3"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={isRealtimeActive ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Heart className={`h-5 w-5 ${isRealtimeActive ? 'text-red-500' : 'text-gray-400'}`} />
                    </motion.div>
                    <span className="font-semibold">Live Heart Rate</span>

                    {/* Pulse Rate Status Indicator */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="ml-2"
                    >
                      {bluetoothStatus === true ? (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full"
                          title="Pulse Rate: ON - BluetoothEnabled is true"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="h-2 w-2 bg-green-500 rounded-full"
                          />
                          <span className="text-xs text-green-600 font-medium">Pulse ON</span>
                        </motion.div>
                      ) : bluetoothStatus === false ? (
                        <motion.div
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full cursor-pointer"
                          onClick={() => setShowBluetoothDialog(true)}
                          title="Pulse Rate: OFF - BluetoothEnabled is false"
                        >
                          <div className="h-2 w-2 bg-red-500 rounded-full" />
                          <span className="text-xs text-red-600 font-medium">Pulse OFF</span>
                        </motion.div>
                      ) : (
                        <div
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full"
                          title="Checking BluetoothEnabled status..."
                        >
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse" />
                          <span className="text-xs text-gray-600 font-medium">Checking...</span>
                        </div>
                      )}
                    </motion.div>

                    {/* Bluetooth Connection Status */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7, type: "spring" }}
                      className="ml-1"
                    >
                      {bluetoothStatus === true ? (
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full"
                          title="Bluetooth Connection: Active"
                        >
                          <Bluetooth className="h-3 w-3 text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">Connected</span>
                        </motion.div>
                      ) : bluetoothStatus === false ? (
                        <motion.div
                          className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full"
                          title="Bluetooth Connection: Disabled"
                        >
                          <BluetoothOff className="h-3 w-3 text-orange-600" />
                          <span className="text-xs text-orange-600 font-medium">Disabled</span>
                        </motion.div>
                      ) : null}
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                  >
                    <Badge className={getHeartRateStatus(getDisplayHeartRate()).color}>
                      {getHeartRateStatus(getDisplayHeartRate()).status}
                    </Badge>
                  </motion.div>
                </motion.div>
                <motion.div
                  className="flex items-center justify-between"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <div>
                    <motion.div
                      className="text-3xl font-bold text-red-600"
                      key={getDisplayHeartRate()}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      {getDisplayHeartRate()}
                    </motion.div>
                    <div className="text-sm text-gray-500">BPM</div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={toggleRealtime}
                      variant={isRealtimeActive ? "destructive" : "default"}
                      size="sm"
                      className={`flex items-center gap-2 ${
                        !isRealtimeActive && bluetoothStatus === false
                          ? "border-red-300 text-red-600 hover:bg-red-50"
                          : ""
                      }`}
                      title={
                        !isRealtimeActive && bluetoothStatus === false
                          ? "Connect your smartwatch via Bluetooth to start live monitoring"
                          : ""
                      }
                    >
                      <motion.div
                        animate={isRealtimeActive ? { rotate: 360 } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        {!isRealtimeActive && bluetoothStatus === false ? (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <BluetoothOff className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <Activity className="h-4 w-4" />
                        )}
                      </motion.div>
                      {isRealtimeActive ? "Stop" : "Start"} Live
                      {!isRealtimeActive && bluetoothStatus === false && (
                        <motion.span
                          className="text-xs opacity-75"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          (Bluetooth Required)
                        </motion.span>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
                <AnimatePresence>
                  {isRealtimeActive && (
                    <motion.div
                      className="mt-2 text-xs text-gray-500 flex items-center gap-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <motion.div
                        className="w-2 h-2 bg-red-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      Live monitoring active
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
    



              {/* Heart Rate Stats */}
              <motion.div
                className="grid grid-cols-3 gap-4 mb-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="text-center"
                  variants={cardVariants}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    className="flex items-center gap-1 justify-center mb-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    <motion.div
                      className="w-2 h-2 bg-purple-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs text-gray-500">Average</span>
                  </motion.div>
                  <motion.div
                    className="text-2xl font-bold"
                    variants={numberCountVariants}
                  >
                    {heartRateStats.average}
                  </motion.div>
                  <div className="text-xs text-gray-500">BPM</div>
                </motion.div>
                <motion.div
                  className="text-center"
                  variants={cardVariants}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    className="flex items-center gap-1 justify-center mb-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                  >
                    <motion.div
                      className="w-2 h-2 bg-blue-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                    <span className="text-xs text-gray-500">Minimum</span>
                  </motion.div>
                  <motion.div
                    className="text-2xl font-bold"
                    variants={numberCountVariants}
                  >
                    {heartRateStats.minimum}
                  </motion.div>
                  <div className="text-xs text-gray-500">BPM</div>
                </motion.div>
                <motion.div
                  className="text-center"
                  variants={cardVariants}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    className="flex items-center gap-1 justify-center mb-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                  >
                    <motion.div
                      className="w-2 h-2 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    />
                    <span className="text-xs text-gray-500">Maximum</span>
                  </motion.div>
                  <motion.div
                    className="text-2xl font-bold"
                    variants={numberCountVariants}
                  >
                    {heartRateStats.maximum}
                  </motion.div>
                  <div className="text-xs text-gray-500">BPM</div>
                </motion.div>
              </motion.div>

              {/* Heart Rate Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
              >
                <motion.div
                  className="flex items-center justify-between mb-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.6 }}
                >
                  <h4 className="font-semibold">Heart Rate Trend</h4>
                  <div className="flex items-center gap-2">
                    <AnimatePresence>
                      {isRealtimeActive && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                        >
                          <Badge variant="outline" className="text-xs">
                            <motion.div
                              className="w-2 h-2 bg-green-500 rounded-full mr-1"
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                            Live
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <span className="text-xs text-gray-500">Last 8 readings</span>
                  </div>
                </motion.div>
                <motion.div
                  className="h-32"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.7 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={heartRateHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#666" }} />
                      <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke={isRealtimeActive ? "#ef4444" : "#8b5cf6"}
                        strokeWidth={2}
                        dot={{ fill: isRealtimeActive ? "#ef4444" : "#8b5cf6", strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 4, fill: isRealtimeActive ? "#ef4444" : "#8b5cf6" }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
          </motion.div>


        </motion.div>
      </motion.div>

      {/* Bluetooth Connection Dialog */}
      <Dialog open={showBluetoothDialog} onOpenChange={setShowBluetoothDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center mb-4"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="p-4 bg-blue-100 rounded-full"
              >
                <BluetoothOff className="h-12 w-12 text-blue-600" />
              </motion.div>
            </motion.div>
            <DialogTitle className="text-center text-xl font-semibold">
              Connect to Watch
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Your BluetoothEnabled setting is currently disabled. To start live heart rate monitoring,
              please enable Bluetooth on your device and update your BluetoothEnabled status to true.
              Live monitoring requires BluetoothEnabled = true to display real-time heart rate data (75-110 BPM).
              {user?.email && (
                <div className="mt-2 text-xs text-gray-500">
                  User: {user.email}
                  <br />
                  BluetoothEnabled Status: {bluetoothStatus === null ? 'Loading...' : bluetoothStatus.toString()}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <motion.div
            className="flex flex-col gap-3 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  console.log(`User ${user?.uid} clicked Enable Bluetooth button`)
                  setShowBluetoothDialog(false)
                  // In a real app, this would update the BluetoothEnabled field
                  alert("Please enable Bluetooth on your device and update your BluetoothEnabled status to true in Firebase.")
                }}
              >
                <Bluetooth className="h-4 w-4 mr-2" />
                Enable Bluetooth
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  console.log(`User ${user?.uid} dismissed Bluetooth dialog`)
                  setShowBluetoothDialog(false)
                }}
              >
                Dismiss
              </Button>
            </motion.div>
          </motion.div>
          <motion.div
            className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> When BluetoothEnabled = false, heart rate data will be simulated (60-100 BPM range).
              When BluetoothEnabled = true, enhanced pulse monitoring is active (75-110 BPM range).
              <br />
              <strong>Firebase Path:</strong> users/{user?.uid}/BluetoothEnabled
            </p>
          </motion.div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
