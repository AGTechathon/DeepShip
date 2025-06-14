"use client"

import { useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Footprints, MapPin, Filter, MoreHorizontal } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import ThreeScene from "@/components/three-scene"

interface DashboardProps {
  user: User
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

export default function Dashboard({ user }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button variant="ghost" className="text-gray-500">
            Home
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">Dashboard</Button>
          <Button variant="ghost" className="text-gray-500">
            Schedule
          </Button>
          <Button variant="ghost" className="text-gray-500">
            History
          </Button>
          <Button variant="ghost" className="text-gray-500">
            Activity
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Health Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Health Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
                  <div className="text-3xl font-bold">1,524</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>+100% This day</span>
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
                  <div className="text-2xl font-bold">98</div>
                  <div className="text-xs text-gray-500">BPM</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Minimum</span>
                  </div>
                  <div className="text-2xl font-bold">48</div>
                  <div className="text-xs text-gray-500">BPM</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Maximum</span>
                  </div>
                  <div className="text-2xl font-bold">118</div>
                  <div className="text-xs text-gray-500">BPM</div>
                </div>
              </div>

              {/* Heart Rate Chart */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Heart Rate</h4>
                  <Button variant="link" className="text-purple-600 text-sm">
                    Real Time
                  </Button>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={heartRateData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#666" }} />
                      <YAxis hide />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 4, fill: "#8b5cf6" }}
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
              <div className="h-32 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Location tracking disabled</p>
                  <Button variant="link" className="text-blue-600 text-sm">
                    Enable tracking
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
