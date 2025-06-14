"use client"

import { useState } from "react"
import type { User } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Clock, Pill, Check, X, Bell } from "lucide-react"

interface MedicineAlertsProps {
  user: User
}

interface MedicineAlert {
  id: number
  name: string
  time: string
  dosage: string
  status: "taken" | "missed" | "upcoming"
  date: string
}

const mockAlerts: MedicineAlert[] = [
  {
    id: 1,
    name: "Vitamin D",
    time: "08:00",
    dosage: "1000 IU",
    status: "taken",
    date: "2024-01-15",
  },
  {
    id: 2,
    name: "Omega-3",
    time: "12:00",
    dosage: "500mg",
    status: "upcoming",
    date: "2024-01-15",
  },
  {
    id: 3,
    name: "Multivitamin",
    time: "20:00",
    dosage: "1 tablet",
    status: "missed",
    date: "2024-01-14",
  },
]

export default function MedicineAlerts({ user }: MedicineAlertsProps) {
  const [alerts, setAlerts] = useState<MedicineAlert[]>(mockAlerts)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({
    name: "",
    time: "",
    dosage: "",
  })

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

  const handleAddAlert = () => {
    if (newAlert.name && newAlert.time && newAlert.dosage) {
      const alert: MedicineAlert = {
        id: Date.now(),
        ...newAlert,
        status: "upcoming",
        date: new Date().toISOString().split("T")[0],
      }
      setAlerts([...alerts, alert])
      setNewAlert({ name: "", time: "", dosage: "" })
      setIsAddDialogOpen(false)
    }
  }

  const markAsTaken = (id: number) => {
    setAlerts(alerts.map((alert) => (alert.id === id ? { ...alert, status: "taken" as const } : alert)))
  }

  const upcomingAlerts = alerts.filter((alert) => alert.status === "upcoming")
  const takenAlerts = alerts.filter((alert) => alert.status === "taken")
  const missedAlerts = alerts.filter((alert) => alert.status === "missed")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Medicine Alerts</h2>
          <p className="text-gray-600">Manage your medication schedule</p>
        </div>
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
