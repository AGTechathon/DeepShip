"use client"

import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import { ref, push, set, onValue, update } from "firebase/database"
import { database } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Clock, Pill, Check, X, Bell } from "lucide-react"
import { toast } from "sonner"

interface MedicineAlertsProps {
  user: User
}

interface MedicineAlert {
  id: string
  name: string
  time: string
  dosage: string
  status: "taken" | "missed" | "upcoming"
  date: string
  createdAt: number
}

export default function MedicineAlerts({ user }: MedicineAlertsProps) {
  const [alerts, setAlerts] = useState<MedicineAlert[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [firebaseError, setFirebaseError] = useState<string | null>(null)
  const [newAlert, setNewAlert] = useState({
    name: "",
    time: "",
    dosage: "",
  })

  // Load alerts from Firebase
  useEffect(() => {
    if (!user?.uid) {
      console.log("No user UID available")
      setLoading(false)
      return
    }

    if (!database) {
      console.error("Firebase database not initialized")
      toast.error("Database connection failed")
      setLoading(false)
      return
    }

    console.log("Loading alerts for user:", user.uid)
    const alertsRef = ref(database, `users/${user.uid}/medicineAlerts`)

    const unsubscribe = onValue(alertsRef, (snapshot) => {
      console.log("Firebase snapshot received:", snapshot.exists())
      const data = snapshot.val()
      if (data) {
        console.log("Alerts data:", data)
        const alertsArray = Object.entries(data).map(([id, alert]: [string, any]) => ({
          id,
          ...alert,
        }))
        // Sort by creation time (newest first)
        alertsArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        setAlerts(alertsArray)
      } else {
        console.log("No alerts data found")
        setAlerts([])
      }
      setLoading(false)
    }, (error) => {
      console.error("Error loading alerts:", error)
      setFirebaseError(error.message)
      toast.error(`Failed to load medicine alerts: ${error.message}`)
      setLoading(false)
    })

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log("Loading timeout reached")
      setLoading(false)
    }, 10000)

    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [user?.uid])

  // Auto-update missed alerts
  useEffect(() => {
    const updateMissedAlerts = async () => {
      if (!user?.uid || alerts.length === 0) return

      const today = new Date().toISOString().split("T")[0]
      const now = new Date()

      for (const alert of alerts) {
        if (alert.status === "upcoming" && alert.date === today) {
          const [hours, minutes] = alert.time.split(':').map(Number)
          const alertTime = new Date()
          alertTime.setHours(hours, minutes, 0, 0)

          // If alert time has passed by more than 30 minutes, mark as missed
          if (now.getTime() - alertTime.getTime() > 30 * 60 * 1000) {
            try {
              const alertRef = ref(database, `users/${user.uid}/medicineAlerts/${alert.id}`)
              await update(alertRef, { status: "missed" })
            } catch (error) {
              console.error("Error updating missed alert:", error)
            }
          }
        }
      }
    }

    const interval = setInterval(updateMissedAlerts, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [alerts, user?.uid])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "taken":
        return "bg-green-100 text-green-800"
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      case "missed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "taken":
        return <Check className="h-4 w-4" />
      case "upcoming":
        return <Clock className="h-4 w-4" />
      case "missed":
        return <X className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const testFirebaseConnection = async () => {
    try {
      console.log("Testing Firebase connection...")
      console.log("User:", user?.uid)
      console.log("Database:", database)

      if (!user?.uid) {
        toast.error("No user authenticated")
        return
      }

      const testRef = ref(database, `users/${user.uid}/test`)
      await set(testRef, { timestamp: Date.now() })
      toast.success("Firebase connection working!")
    } catch (error) {
      console.error("Firebase test failed:", error)
      toast.error(`Firebase test failed: ${error}`)
    }
  }

  const addSampleAlert = async () => {
    try {
      if (!user?.uid) {
        toast.error("No user authenticated")
        return
      }

      const alertsRef = ref(database, `users/${user.uid}/medicineAlerts`)
      const newAlertRef = push(alertsRef)

      const sampleAlert = {
        name: "Sample Medicine",
        time: "14:30",
        dosage: "1 tablet",
        status: "upcoming" as const,
        date: new Date().toISOString().split("T")[0],
        createdAt: Date.now(),
      }

      await set(newAlertRef, sampleAlert)
      toast.success("Sample alert added!")
    } catch (error: any) {
      console.error("Error adding sample alert:", error)
      toast.error(`Failed to add sample alert: ${error.message}`)
    }
  }

  const handleAddAlert = async () => {
    console.log("Add Alert button clicked!")
    console.log("New Alert data:", newAlert)
    console.log("User:", user?.uid)

    if (!newAlert.name || !newAlert.time || !newAlert.dosage) {
      toast.error("Please fill in all fields")
      return
    }

    if (!user?.uid) {
      toast.error("User not authenticated")
      return
    }

    try {
      console.log("Attempting to save to Firebase...")
      const alertsRef = ref(database, `users/${user.uid}/medicineAlerts`)
      const newAlertRef = push(alertsRef)

      const alert = {
        name: newAlert.name,
        time: newAlert.time,
        dosage: newAlert.dosage,
        status: "upcoming" as const,
        date: new Date().toISOString().split("T")[0],
        createdAt: Date.now(),
      }

      console.log("Alert to save:", alert)
      await set(newAlertRef, alert)
      console.log("Alert saved successfully!")

      setNewAlert({ name: "", time: "", dosage: "" })
      setIsAddDialogOpen(false)
      toast.success("Medicine alert added successfully!")
    } catch (error: any) {
      console.error("Error adding alert:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)
      toast.error(`Failed to add medicine alert: ${error.message || error}`)
    }
  }

  const markAsTaken = async (id: string) => {
    if (!user?.uid) {
      toast.error("User not authenticated")
      return
    }

    try {
      const alertRef = ref(database, `users/${user.uid}/medicineAlerts/${id}`)
      await update(alertRef, {
        status: "taken",
        takenAt: Date.now()
      })
      toast.success("Marked as taken!")
    } catch (error) {
      console.error("Error updating alert:", error)
      toast.error("Failed to update alert status")
    }
  }

  // Helper function to check if alert is for today
  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split("T")[0]
    return dateString === today
  }

  // Helper function to check if alert time has passed
  const isTimePassed = (timeString: string) => {
    const now = new Date()
    const [hours, minutes] = timeString.split(':').map(Number)
    const alertTime = new Date()
    alertTime.setHours(hours, minutes, 0, 0)
    return now > alertTime
  }

  // Filter alerts with better logic
  const todaysAlerts = alerts.filter(alert => isToday(alert.date))
  const upcomingAlerts = todaysAlerts.filter(alert =>
    alert.status === "upcoming" && !isTimePassed(alert.time)
  )
  const takenAlerts = todaysAlerts.filter(alert => alert.status === "taken")
  const missedAlerts = todaysAlerts.filter(alert =>
    alert.status === "upcoming" && isTimePassed(alert.time)
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600 mt-4">Loading medicine alerts...</span>
          <p className="text-sm text-gray-500 mt-2">If this takes too long, please refresh the page</p>
        </div>
      </div>
    )
  }

  if (firebaseError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-center items-center py-12">
          <div className="text-red-500 text-center">
            <h3 className="text-lg font-semibold mb-2">Firebase Connection Error</h3>
            <p className="text-sm mb-4">{firebaseError}</p>
            <p className="text-xs text-gray-500 mb-4">
              This might be due to Firebase database rules. Please check your Firebase console.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Medicine Alerts</h2>
          <p className="text-gray-600">Manage your medication schedule</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={testFirebaseConnection}>
            Test Firebase
          </Button>
          <Button variant="outline" onClick={addSampleAlert}>
            Add Sample
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Medicine Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="medicine-name">Medicine Name</Label>
                <Input
                  id="medicine-name"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                  placeholder="Enter medicine name"
                />
              </div>
              <div>
                <Label htmlFor="medicine-time">Time</Label>
                <Input
                  id="medicine-time"
                  type="time"
                  value={newAlert.time}
                  onChange={(e) => setNewAlert({ ...newAlert, time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="medicine-dosage">Dosage</Label>
                <Input
                  id="medicine-dosage"
                  value={newAlert.dosage}
                  onChange={(e) => setNewAlert({ ...newAlert, dosage: e.target.value })}
                  placeholder="e.g., 500mg, 1 tablet"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddAlert} className="flex-1">
                  Add Alert
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taken Today</p>
                <p className="text-2xl font-bold">{takenAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Missed</p>
                <p className="text-2xl font-bold">{missedAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAlerts.length > 0 ? (
            <div className="space-y-3">
              {upcomingAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Pill className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{alert.name}</h3>
                      <p className="text-sm text-gray-600">
                        {alert.dosage} at {alert.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(alert.status)}>
                      {getStatusIcon(alert.status)}
                      <span className="ml-1 capitalize">{alert.status}</span>
                    </Badge>
                    <Button size="sm" onClick={() => markAsTaken(alert.id)}>
                      Mark as Taken
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming alerts</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>All Medicine Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Pill className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{alert.name}</h3>
                    <p className="text-sm text-gray-600">
                      {alert.dosage} at {alert.time}
                    </p>
                    <p className="text-xs text-gray-500">{alert.date}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(alert.status)}>
                  {getStatusIcon(alert.status)}
                  <span className="ml-1 capitalize">{alert.status}</span>
                </Badge>
              </div>
            ))}
          </div>

          {alerts.length === 0 && (
            <div className="text-center py-12">
              <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Medicine Alerts</h3>
              <p className="text-gray-500 mb-4">Add your first medicine alert to get started</p>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine Alert
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
