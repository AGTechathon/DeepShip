"use client"

import { useState } from "react"
import type { User } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Filter, Download, FileText, Activity, Heart, Moon, MapPin } from "lucide-react"
import { generateHealthReport } from "@/lib/pdf-generator"

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

  // Sample health data - in a real app, this would come from your database
  const getCurrentHealthData = () => ({
    steps: 8420,
    heartRate: {
      average: 78,
      minimum: 48,
      maximum: 118
    },
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: "San Francisco, CA, USA"
    },
    medicines: [
      {
        name: "Vitamin D3",
        timing: "Morning with breakfast",
        dosage: "1000 IU daily"
      },
      {
        name: "Omega-3",
        timing: "Evening with dinner",
        dosage: "500mg twice daily"
      },
      {
        name: "Multivitamin",
        timing: "Morning",
        dosage: "1 tablet daily"
      }
    ],
    alerts: [
      {
        message: "Time to take your Vitamin D3",
        time: "Today at 8:00 AM",
        type: "medication"
      },
      {
        message: "Heart rate elevated during workout",
        time: "Yesterday at 3:30 PM",
        type: "health"
      },
      {
        message: "Daily step goal achieved!",
        time: "Today at 6:45 PM",
        type: "achievement"
      }
    ],
    date: new Date().toLocaleDateString()
  })

  const handleDownloadReport = () => {
    const healthData = getCurrentHealthData()
    generateHealthReport(user, healthData)
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
        <Button
          className="bg-gradient-to-r from-purple-600 to-blue-600"
          onClick={handleDownloadReport}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Report (PDF)
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Daily Steps</p>
                <p className="text-2xl font-bold">8,420</p>
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
                <p className="text-sm text-gray-600">Heart Rate</p>
                <p className="text-2xl font-bold">78 BPM</p>
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
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-sm font-bold">San Francisco</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Moon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Medicines</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Alerts</p>
                <p className="text-2xl font-bold">3</p>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadReport}
                      title="Download PDF Report"
                    >
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
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Ready to Generate Report</h3>
              <p className="text-gray-500 mb-4">Download your comprehensive health report as PDF</p>
              <Button
                className="bg-gradient-to-r from-purple-600 to-blue-600"
                onClick={handleDownloadReport}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report (PDF)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
