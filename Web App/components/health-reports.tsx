"use client"

import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp
} from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Filter, Download, FileText, Activity, Heart, Moon, MapPin } from "lucide-react"
import { generateHealthReport } from "@/lib/pdf-generator"
import { motion, AnimatePresence } from "framer-motion"

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
  const [medicineAlerts, setMedicineAlerts] = useState<any[]>([])

  // Load medicine alerts from Firestore
  useEffect(() => {
    if (!user?.uid) return

    const alertsQuery = query(
      collection(firestore, "VocalEyes"),
      where("userId", "==", user.uid),
      where("type", "==", "medicine_alert")
    )

    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alertsArray: any[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        alertsArray.push({
          id: doc.id,
          name: data.name,
          time: data.time,
          dosage: data.dosage,
          status: data.status,
          date: data.date,
          createdAt: data.createdAt,
        })
      })
      setMedicineAlerts(alertsArray)
    })

    return () => unsubscribe()
  }, [user?.uid])

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

  // Get current health data including real medicine alerts from Firebase
  const getCurrentHealthData = () => {
    // Convert medicine alerts to the format expected by PDF generator
    const medicines = medicineAlerts.map(alert => ({
      name: alert.name,
      timing: `Daily at ${alert.time}`,
      dosage: alert.dosage
    }))

    // Convert medicine alerts to alert format for PDF
    const medicineAlertsForPdf = medicineAlerts.map(alert => ({
      message: `Time to take your ${alert.name}`,
      time: `Daily at ${alert.time}`,
      type: "medication"
    }))

    // Add some sample health and achievement alerts
    const additionalAlerts = [
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
    ]

    return {
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
      medicines: medicines.length > 0 ? medicines : [
        {
          name: "No medicines added",
          timing: "Add medicines in Medicine Alerts section",
          dosage: "N/A"
        }
      ],
      alerts: [...medicineAlertsForPdf, ...additionalAlerts],
      date: new Date().toLocaleDateString()
    }
  }

  const handleDownloadReport = () => {
    const healthData = getCurrentHealthData()
    generateHealthReport(user, healthData)
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Actions */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 justify-between"
        variants={cardVariants}
      >
        <motion.div
          className="flex gap-3"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </motion.div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            className="bg-gradient-to-r from-purple-600 to-blue-600"
            onClick={handleDownloadReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report (PDF)
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-5 gap-4"
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
                  <Activity className="h-5 w-5 text-blue-600" />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-600">Daily Steps</p>
                  <motion.p
                    className="text-2xl font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    8,420
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
                  className="p-2 bg-red-100 rounded-full"
                  whileHover={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  <Heart className="h-5 w-5 text-red-600" />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-600">Heart Rate</p>
                  <motion.p
                    className="text-2xl font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    78 BPM
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
                  whileHover={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  <MapPin className="h-5 w-5 text-green-600" />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <motion.p
                    className="text-sm font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    San Francisco
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
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <Moon className="h-5 w-5 text-purple-600" />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-600">Medicines</p>
                  <motion.p
                    className="text-2xl font-bold"
                    key={medicineAlerts.length}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {medicineAlerts.length}
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
                  className="p-2 bg-orange-100 rounded-full"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <FileText className="h-5 w-5 text-orange-600" />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-600">Alerts</p>
                  <motion.p
                    className="text-2xl font-bold"
                    key={medicineAlerts.length + 2}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {medicineAlerts.length + 2}
                  </motion.p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Reports List */}
      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.01 }}
      >
        <Card>
          <CardHeader>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <CardTitle>Health Reports</CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.div
              className="space-y-4"
              variants={containerVariants}
            >
              <AnimatePresence>
                {mockReports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: 1.0 + index * 0.1 }}
                    whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="p-2 bg-purple-100 rounded-full"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <FileText className="h-4 w-4 text-purple-600" />
                        </motion.div>
                        <div>
                          <h3 className="font-semibold">{report.type}</h3>
                          <p className="text-sm text-gray-600">{report.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.2 + index * 0.1 }}
                        >
                          <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownloadReport}
                            title="Download PDF Report"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    <motion.div
                      className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.4 + index * 0.1 }}
                    >
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
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {mockReports.length === 0 && (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: 1.0 }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Ready to Generate Report</h3>
                  <p className="text-gray-500 mb-4">Download your comprehensive health report as PDF</p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-blue-600"
                      onClick={handleDownloadReport}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Report (PDF)
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
