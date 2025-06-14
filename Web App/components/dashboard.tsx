"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { User } from "firebase/auth"
import { ref, onValue } from "firebase/database"
import { database } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Footprints, MapPin, Filter, MoreHorizontal, Heart, Activity } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import ThreeScene from "@/components/three-scene"

// Dynamically import the compact map component to avoid SSR issues
const CompactLocationMap = dynamic(() => import("@/components/compact-location-map"), {
  ssr: false,
  loading: () => (
    <div className="h-32 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
    </div>
  ),
})

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
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentHeartRate, setCurrentHeartRate] = useState(78)
  const [heartRateHistory, setHeartRateHistory] = useState(heartRateData)
  const [isRealtimeActive, setIsRealtimeActive] = useState(false)
  const [heartRateStats, setHeartRateStats] = useState({
    average: 78,
    minimum: 65,
    maximum: 95
  })
  const [location, setLocation] = useState<LocationData>({
    lat: 17.613409, // Default coordinates
    lng: 75.891103,
    lastUpdated: "6/14/2025, 5:55:59 PM",
  })
  const [fitSteps, setFitSteps] = useState<number | null>(null)
  const [fitHeartRate, setFitHeartRate] = useState<number | null>(null)
  const [fitLocation, setFitLocation] = useState<{lat: number, lng: number} | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Load location data from Firebase
  useEffect(() => {
    if (!user?.uid) return

    const locationRef = ref(database, `users/${user.uid}/liveLocation`)
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setLocation(data)
      }
    })

    return () => unsubscribe()
  }, [user?.uid])

  // Realtime heart rate simulation
  useEffect(() => {
    if (!isRealtimeActive) return

    const heartRateInterval = setInterval(() => {
      // Simulate realistic heart rate variations (60-100 BPM normal range)
      const baseRate = 75
      const variation = Math.sin(Date.now() / 10000) * 10 + Math.random() * 8 - 4
      const newRate = Math.round(Math.max(60, Math.min(100, baseRate + variation)))

      setCurrentHeartRate(newRate)

      // Update chart data (keep last 8 points)
      const now = new Date()
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })

      setHeartRateHistory(prev => {
        const newData = [...prev.slice(1), { time: timeString, rate: newRate }]

        // Update stats based on recent data
        const rates = newData.map(d => d.rate)
        const avg = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
        const min = Math.min(...rates)
        const max = Math.max(...rates)

        setHeartRateStats({ average: avg, minimum: min, maximum: max })

        return newData
      })
    }, 2000) // Update every 2 seconds

    return () => clearInterval(heartRateInterval)
  }, [isRealtimeActive])

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
        setFitSteps(steps || 0);
        
        // Parse heart rate (average)
        const heartPoints = data.bucket?.[0]?.dataset?.find((ds: any) => ds.dataSourceId?.includes('heart_rate'))?.point;
        let avgHeart = null;
        if (heartPoints && heartPoints.length > 0) {
          const sum = heartPoints.reduce((acc: number, pt: any) => acc + (pt.value?.[0]?.fpVal || 0), 0);
          avgHeart = Math.round(sum / heartPoints.length);
        }
        setFitHeartRate(avgHeart);
        
        // Parse location (last sample)
        const locPoints = data.bucket?.[0]?.dataset?.find((ds: any) => ds.dataSourceId?.includes('location'))?.point;
        if (locPoints && locPoints.length > 0) {
          const last = locPoints[locPoints.length - 1];
          setFitLocation({ lat: last.value?.[0]?.fpVal, lng: last.value?.[1]?.fpVal });
        }
      } catch (error) {
        console.error('Error fetching Google Fit data:', error);
        // You might want to show an error message to the user here
      }
    };
    fetchGoogleFitData();
  }, [googleFitToken]);

  const toggleRealtime = () => {
    setIsRealtimeActive(!isRealtimeActive)
  }

  const getHeartRateStatus = (rate: number) => {
    if (rate < 60) return { status: "Low", color: "bg-blue-500", textColor: "text-blue-600" }
    if (rate > 100) return { status: "High", color: "bg-red-500", textColor: "text-red-600" }
    return { status: "Normal", color: "bg-green-500", textColor: "text-green-600" }
  }

  return (
    <div className="space-y-6">
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Health Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Health Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Steps */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Footprints className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Steps</span>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">{fitSteps || 1524}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>+100% This day</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Realtime Heart Rate */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <Heart className={`h-5 w-5 ${isRealtimeActive ? 'text-red-500 animate-pulse' : 'text-red-600'}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Heart Rate</span>
                  </div>
                  <Button
                    onClick={toggleRealtime}
                    variant={isRealtimeActive ? "destructive" : "outline"}
                    size="sm"
                    className="h-8 px-3 text-xs"
                  >
                    {isRealtimeActive ? "Stop" : "Start"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-red-600">{fitHeartRate || currentHeartRate}</div>
                    <span className="text-sm text-gray-500">BPM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getHeartRateStatus(fitHeartRate || currentHeartRate).textColor} border-current`}
                    >
                      {getHeartRateStatus(fitHeartRate || currentHeartRate).status}
                    </Badge>
                    {isRealtimeActive && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        Live
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Checkup Schedule</CardTitle>
              <Button variant="link" className="text-purple-600">
                Show More
              </Button>
            </CardHeader>
            <CardContent>
              {/* Calendar */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="text-center p-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        i === 5 ? "bg-purple-600 text-white" : "hover:bg-gray-100"
                      }`}
                    >
                      {15 + i}
                    </div>
                  </div>
                ))}
              </div>

              {/* Appointments */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-cyan-50 rounded-lg">
                  <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                    <span className="text-cyan-600 font-semibold">DC</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Dental Checkup</h4>
                    <p className="text-sm text-gray-600">Dr. John Cooper</p>
                    <p className="text-xs text-gray-500">All Departments are fine, but you still need...</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">CS</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Cancer Screening</h4>
                    <p className="text-sm text-gray-600">Dr. Samson Wisemore</p>
                    <p className="text-xs text-gray-500">All Departments are fine, but you still need...</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medical Checkup History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Category</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Duration</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Calory Burned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        category: "Running",
                        date: "20 April, 2024",
                        duration: "030 Minutes",
                        calories: "140 Calory Burned",
                        color: "purple",
                      },
                      {
                        category: "Cycling",
                        date: "18 April, 2024",
                        duration: "030 Minutes",
                        calories: "140 Calory Burned",
                        color: "orange",
                      },
                      {
                        category: "Swimming",
                        date: "16 April, 2024",
                        duration: "030 Minutes",
                        calories: "140 Calory Burned",
                        color: "blue",
                      },
                      {
                        category: "Yoga",
                        date: "10 April, 2024",
                        duration: "030 Minutes",
                        calories: "140 Calory Burned",
                        color: "green",
                      },
                    ].map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${item.color}-500`}></div>
                            {item.category}
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">{item.date}</td>
                        <td className="p-3 text-gray-600">{item.duration}</td>
                        <td className="p-3 text-gray-600">{item.calories}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Heart Statistics & 3D Scene */}
        <div className="space-y-6">
          {/* Heart Statistics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Your Heart Statistic</CardTitle>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {/* Realtime Heart Rate Display */}
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Heart className={`h-5 w-5 ${isRealtimeActive ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                    <span className="font-semibold">Live Heart Rate</span>
                  </div>
                  <Badge className={getHeartRateStatus(fitHeartRate || currentHeartRate).color}>
                    {getHeartRateStatus(fitHeartRate || currentHeartRate).status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-red-600">{fitHeartRate || currentHeartRate}</div>
                    <div className="text-sm text-gray-500">BPM</div>
                  </div>
                  <Button
                    onClick={toggleRealtime}
                    variant={isRealtimeActive ? "destructive" : "default"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    {isRealtimeActive ? "Stop" : "Start"} Live
                  </Button>
                </div>
                {isRealtimeActive && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Live monitoring active
                  </div>
                )}
              </div>
              {/* 3D Heart Visualization */}
              <div className="h-48 mb-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg overflow-hidden">
                <ThreeScene />
              </div>

              {/* Heart Rate Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center mb-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Average</span>
                  </div>
                  <div className="text-2xl font-bold">{heartRateStats.average}</div>
                  <div className="text-xs text-gray-500">BPM</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Minimum</span>
                  </div>
                  <div className="text-2xl font-bold">{heartRateStats.minimum}</div>
                  <div className="text-xs text-gray-500">BPM</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Maximum</span>
                  </div>
                  <div className="text-2xl font-bold">{heartRateStats.maximum}</div>
                  <div className="text-xs text-gray-500">BPM</div>
                </div>
              </div>

              {/* Heart Rate Chart */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Heart Rate Trend</h4>
                  <div className="flex items-center gap-2">
                    {isRealtimeActive && (
                      <Badge variant="outline" className="text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                        Live
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">Last 8 readings</span>
                  </div>
                </div>
                <div className="h-32">
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Location Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Live Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fitLocation ? (
                <div className="space-y-2">
                  <div className="h-32 rounded-lg overflow-hidden">
                    <CompactLocationMap
                      latitude={fitLocation.lat}
                      longitude={fitLocation.lng}
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Lat: {fitLocation.lat.toFixed(6)}, Lng: {fitLocation.lng.toFixed(6)}
                  </div>
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Location tracking disabled</p>
                    <Button variant="link" className="text-blue-600 text-sm">
                      Enable tracking
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
