"use client"

import { useState } from "react"
import type { User } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Upload, Filter, Download, FileText, Activity, Heart, Moon } from "lucide-react"

interface HealthReportsProps {
  user: User
}

const mockReports = [
  {
    id: 1,
    date: "2024-01-15",
    type: "Daily Summary",
    calories: 2150,
    avgHeartRate: 78,
    sleep: 7.5,
    steps: 8420,
    status: "Good",
  },
  {
    id: 2,
    date: "2024-01-14",
    type: "Daily Summary",
    calories: 1980,
    avgHeartRate: 82,
    sleep: 6.8,
    steps: 7230,
    status: "Fair",
  },
  {
    id: 3,
    date: "2024-01-13",
    type: "Weekly Report",
    calories: 14500,
    avgHeartRate: 75,
    sleep: 8.2,
    steps: 52000,
    status: "Excellent",
  },
]

export default function HealthReports({ user }: HealthReportsProps) {
  const [selectedDate, setSelectedDate] = useState("")
  const [filterType, setFilterType] = useState("all")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excellent":
        return "bg-green-100 text-green-800"
      case "Good":
        return "bg-blue-100 text-blue-800"
      case "Fair":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
          <Upload className="h-4 w-4 mr-2" />
          Upload Report
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Calories</p>
                <p className="text-2xl font-bold">2,043</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Heart Rate</p>
                <p className="text-2xl font-bold">78 BPM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Moon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Sleep</p>
                <p className="text-2xl font-bold">7.5h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold">{mockReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Health Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockReports.map((report) => (
              <div key={report.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{report.type}</h3>
                      <p className="text-sm text-gray-600">{report.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Calories</p>
                    <p className="font-semibold">{report.calories.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Heart Rate</p>
                    <p className="font-semibold">{report.avgHeartRate} BPM</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sleep</p>
                    <p className="font-semibold">{report.sleep}h</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Steps</p>
                    <p className="font-semibold">{report.steps.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {mockReports.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Reports Yet</h3>
              <p className="text-gray-500 mb-4">Upload your first health report to get started</p>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                <Upload className="h-4 w-4 mr-2" />
                Upload Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
