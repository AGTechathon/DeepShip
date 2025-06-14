"use client"

import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  Timestamp
} from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Clock, Pill, Check, X, Bell, Trash2, Edit } from "lucide-react"
import { toast } from "sonner"

interface MedicinesScheduleProps {
  user: User
}

interface MedicineSchedule {
  id: string
  userId: string
  name: string
  time: string
  dosage: string
  days: string[] // Array of days: ['monday', 'tuesday', etc.]
  status: "active" | "inactive"
  createdAt: Timestamp
  notes?: string
}

interface DailyMedicine {
  id: string
  scheduleId: string
  name: string
  time: string
  dosage: string
  date: string
  status: "taken" | "missed" | "upcoming"
  takenAt?: Timestamp
}

export default function MedicinesSchedule({ user }: MedicinesScheduleProps) {
  const [schedules, setSchedules] = useState<MedicineSchedule[]>([])
  const [dailyMedicines, setDailyMedicines] = useState<DailyMedicine[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<MedicineSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [newSchedule, setNewSchedule] = useState({
    name: "",
    time: "",
    dosage: "",
    days: [] as string[],
    notes: ""
  })

  const daysOfWeek = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' }
  ]

  // Load medicine schedules from Firestore
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    const schedulesQuery = query(
      collection(firestore, "VocalEyes"),
      where("userId", "==", user.uid),
      where("type", "==", "medicine_schedule")
    )

    const unsubscribe = onSnapshot(schedulesQuery, (snapshot) => {
      const schedulesArray: MedicineSchedule[] = []
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        schedulesArray.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          time: data.time,
          dosage: data.dosage,
          days: data.days || [],
          status: data.status || "active",
          createdAt: data.createdAt,
          notes: data.notes,
        })
      })
      
      setSchedules(schedulesArray)
      setLoading(false)
    }, (error) => {
      console.error("Error loading schedules:", error)
      toast.error(`Failed to load medicine schedules: ${error.message}`)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  // Generate daily medicines for the current week
  useEffect(() => {
    if (schedules.length === 0) {
      setDailyMedicines([])
      return
    }

    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday

    const weeklyMedicines: DailyMedicine[] = []

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + i)
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const dateString = currentDate.toISOString().split('T')[0]

      schedules.forEach(schedule => {
        if (schedule.status === "active" && schedule.days.includes(dayName)) {
          weeklyMedicines.push({
            id: `${schedule.id}-${dateString}`,
            scheduleId: schedule.id,
            name: schedule.name,
            time: schedule.time,
            dosage: schedule.dosage,
            date: dateString,
            status: "upcoming" // Will be updated based on actual data
          })
        }
      })
    }

    setDailyMedicines(weeklyMedicines)
  }, [schedules])

  const handleAddSchedule = async () => {
    if (!newSchedule.name || !newSchedule.time || !newSchedule.dosage || newSchedule.days.length === 0) {
      toast.error("Please fill in all required fields and select at least one day")
      return
    }

    if (!user?.uid) {
      toast.error("User not authenticated")
      return
    }

    try {
      const schedule = {
        userId: user.uid,
        type: "medicine_schedule",
        name: newSchedule.name,
        time: newSchedule.time,
        dosage: newSchedule.dosage,
        days: newSchedule.days,
        status: "active",
        createdAt: Timestamp.now(),
        notes: newSchedule.notes
      }

      await addDoc(collection(firestore, "VocalEyes"), schedule)
      setNewSchedule({ name: "", time: "", dosage: "", days: [], notes: "" })
      setIsAddDialogOpen(false)
      toast.success("Medicine schedule added successfully!")
    } catch (error: any) {
      console.error("Error adding schedule:", error)
      toast.error(`Failed to add medicine schedule: ${error.message}`)
    }
  }

  const handleEditSchedule = async () => {
    if (!editingSchedule || !newSchedule.name || !newSchedule.time || !newSchedule.dosage || newSchedule.days.length === 0) {
      toast.error("Please fill in all required fields and select at least one day")
      return
    }

    try {
      const scheduleRef = doc(firestore, "VocalEyes", editingSchedule.id)
      await updateDoc(scheduleRef, {
        name: newSchedule.name,
        time: newSchedule.time,
        dosage: newSchedule.dosage,
        days: newSchedule.days,
        notes: newSchedule.notes
      })
      
      setEditingSchedule(null)
      setNewSchedule({ name: "", time: "", dosage: "", days: [], notes: "" })
      setIsEditDialogOpen(false)
      toast.success("Medicine schedule updated successfully!")
    } catch (error: any) {
      console.error("Error updating schedule:", error)
      toast.error(`Failed to update medicine schedule: ${error.message}`)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this medicine schedule?")) {
      return
    }

    try {
      await deleteDoc(doc(firestore, "VocalEyes", scheduleId))
      toast.success("Medicine schedule deleted successfully!")
    } catch (error: any) {
      console.error("Error deleting schedule:", error)
      toast.error(`Failed to delete medicine schedule: ${error.message}`)
    }
  }

  const openEditDialog = (schedule: MedicineSchedule) => {
    setEditingSchedule(schedule)
    setNewSchedule({
      name: schedule.name,
      time: schedule.time,
      dosage: schedule.dosage,
      days: schedule.days,
      notes: schedule.notes || ""
    })
    setIsEditDialogOpen(true)
  }

  const toggleDay = (day: string) => {
    setNewSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }))
  }

  const getWeekDates = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      return {
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        dayShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: date.toDateString() === today.toDateString()
      }
    })
  }

  const getMedicinesForDay = (dayName: string, dateString: string) => {
    return dailyMedicines.filter(med => {
      const medDate = new Date(med.date)
      const medDayName = medDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      return medDayName === dayName && med.date === dateString
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Medicines Schedule</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Medicine Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="medicine-name">Medicine Name</Label>
                <Input
                  id="medicine-name"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  placeholder="Enter medicine name"
                />
              </div>
              <div>
                <Label htmlFor="medicine-time">Time</Label>
                <Input
                  id="medicine-time"
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="medicine-dosage">Dosage</Label>
                <Input
                  id="medicine-dosage"
                  value={newSchedule.dosage}
                  onChange={(e) => setNewSchedule({ ...newSchedule, dosage: e.target.value })}
                  placeholder="e.g., 500mg, 1 tablet"
                />
              </div>
              <div>
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {daysOfWeek.map(day => (
                    <Button
                      key={day.key}
                      type="button"
                      variant={newSchedule.days.includes(day.key) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day.key)}
                      className="text-xs"
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="medicine-notes">Notes (Optional)</Label>
                <Input
                  id="medicine-notes"
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddSchedule} className="flex-1">
                  Add Schedule
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Weekly Calendar View */}
        <div className="space-y-4">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-2">
            {getWeekDates().map((day, index) => (
              <div key={index} className={`text-center p-3 rounded-lg border ${
                day.isToday ? 'bg-purple-100 border-purple-300' : 'bg-gray-50'
              }`}>
                <div className="text-xs font-medium text-gray-600">{day.dayShort}</div>
                <div className={`text-lg font-bold ${day.isToday ? 'text-purple-600' : 'text-gray-900'}`}>
                  {day.dayNumber}
                </div>
              </div>
            ))}
          </div>

          {/* Medicines for each day */}
          <div className="grid grid-cols-7 gap-2">
            {getWeekDates().map((day, index) => {
              const dayMedicines = getMedicinesForDay(day.dayName, day.date.toISOString().split('T')[0])
              return (
                <div key={index} className="space-y-1 min-h-[100px]">
                  {dayMedicines.map((medicine) => (
                    <div
                      key={medicine.id}
                      className="p-2 bg-blue-50 border border-blue-200 rounded text-xs"
                    >
                      <div className="font-medium text-blue-900 truncate">{medicine.name}</div>
                      <div className="text-blue-700">{medicine.time}</div>
                      <div className="text-blue-600 text-xs">{medicine.dosage}</div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Medicine Schedules List */}
        <div className="mt-6 space-y-3">
          <h4 className="font-semibold text-gray-900">All Medicine Schedules</h4>
          {schedules.length > 0 ? (
            schedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Pill className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{schedule.name}</h3>
                    <p className="text-sm text-gray-600">
                      {schedule.dosage} at {schedule.time}
                    </p>
                    <p className="text-xs text-gray-500">
                      {schedule.days.map(day => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ')}
                    </p>
                    {schedule.notes && (
                      <p className="text-xs text-gray-500 italic">{schedule.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={schedule.status === "active" ? "default" : "secondary"}>
                    {schedule.status}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(schedule)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteSchedule(schedule.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No medicine schedules yet</p>
              <Button 
                className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600" 
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Medicine
              </Button>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Medicine Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-medicine-name">Medicine Name</Label>
                <Input
                  id="edit-medicine-name"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  placeholder="Enter medicine name"
                />
              </div>
              <div>
                <Label htmlFor="edit-medicine-time">Time</Label>
                <Input
                  id="edit-medicine-time"
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-medicine-dosage">Dosage</Label>
                <Input
                  id="edit-medicine-dosage"
                  value={newSchedule.dosage}
                  onChange={(e) => setNewSchedule({ ...newSchedule, dosage: e.target.value })}
                  placeholder="e.g., 500mg, 1 tablet"
                />
              </div>
              <div>
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {daysOfWeek.map(day => (
                    <Button
                      key={day.key}
                      type="button"
                      variant={newSchedule.days.includes(day.key) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day.key)}
                      className="text-xs"
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-medicine-notes">Notes (Optional)</Label>
                <Input
                  id="edit-medicine-notes"
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditSchedule} className="flex-1">
                  Update Schedule
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
