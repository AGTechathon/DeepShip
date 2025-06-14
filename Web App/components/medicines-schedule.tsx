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
import { Plus, Clock, Pill, Check, X, Bell, Trash2, Edit, Calendar } from "lucide-react"
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
      collection(firestore, `users/${user.uid}/medicine_schedules`)
    )

    const unsubscribe = onSnapshot(schedulesQuery, (snapshot) => {
      const schedulesArray: MedicineSchedule[] = []

      console.log('Loading schedules from Firestore. Snapshot size:', snapshot.size)

      snapshot.forEach((doc) => {
        const data = doc.data()
        console.log('Schedule document data:', doc.id, data)

        schedulesArray.push({
          id: doc.id,
          userId: user.uid, // Use current user's UID
          name: data.name,
          time: data.time,
          dosage: data.dosage,
          days: data.days || [],
          status: data.status || "active",
          createdAt: data.createdAt,
          notes: data.notes,
        })
      })

      console.log('Final schedules array:', schedulesArray)
      setSchedules(schedulesArray)
      setLoading(false)
    }, (error) => {
      console.error("Error loading schedules:", error)
      toast.error(`Failed to load medicine schedules: ${error.message}`)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  // Load daily medicine statuses from Firestore
  const [dailyMedicinesMap, setDailyMedicinesMap] = useState(new Map())

  useEffect(() => {
    if (!user?.uid) return

    const dailyMedicinesQuery = query(
      collection(firestore, `users/${user.uid}/daily_medicines`)
    )

    const unsubscribe = onSnapshot(dailyMedicinesQuery, (snapshot) => {
      const newDailyMedicinesMap = new Map()

      snapshot.forEach((doc) => {
        const data = doc.data()
        newDailyMedicinesMap.set(`${data.scheduleId}-${data.date}`, {
          id: doc.id,
          status: data.status,
          takenAt: data.takenAt
        })
      })

      setDailyMedicinesMap(newDailyMedicinesMap)
    })

    return () => unsubscribe()
  }, [user?.uid])

  // Generate daily medicines for the current week
  useEffect(() => {
    console.log('Generating daily medicines. Schedules:', schedules)

    if (schedules.length === 0) {
      console.log('No schedules found, setting empty daily medicines')
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

      console.log(`Processing day ${i}: ${dayName} (${dateString})`)

      schedules.forEach(schedule => {
        console.log(`Checking schedule "${schedule.name}" - Status: ${schedule.status}, Days: [${schedule.days.join(', ')}]`)

        if (schedule.status === "active" && schedule.days.includes(dayName)) {
          console.log(`✓ Schedule "${schedule.name}" matches ${dayName}`)

          const dailyMedicineKey = `${schedule.id}-${dateString}`
          const existingDaily = dailyMedicinesMap.get(dailyMedicineKey)

          // Determine status based on time and existing data
          let status: "taken" | "missed" | "upcoming" = "upcoming"
          let takenAt: Timestamp | undefined = undefined

          if (existingDaily) {
            status = existingDaily.status
            takenAt = existingDaily.takenAt
          } else {
            // Check if grace period has passed for today's medicines
            const now = new Date()
            const isToday = dateString === now.toISOString().split('T')[0]

            if (isToday) {
              const [hours, minutes] = schedule.time.split(':').map(Number)
              const medicineTime = new Date()
              medicineTime.setHours(hours, minutes, 0, 0)

              // Add 30-minute grace period before marking as missed
              const gracePeriodMs = 30 * 60 * 1000 // 30 minutes in milliseconds
              const missedThreshold = medicineTime.getTime() + gracePeriodMs

              if (now.getTime() > missedThreshold) {
                status = "missed"
              }
            }
          }

          const dailyMedicine = {
            id: existingDaily?.id || `${schedule.id}-${dateString}`,
            scheduleId: schedule.id,
            name: schedule.name,
            time: schedule.time,
            dosage: schedule.dosage,
            date: dateString,
            status: status,
            takenAt: takenAt
          }

          console.log(`Adding daily medicine:`, dailyMedicine)
          weeklyMedicines.push(dailyMedicine)
        } else {
          console.log(`✗ Schedule "${schedule.name}" does not match ${dayName} - Status: ${schedule.status}, Days: [${schedule.days.join(', ')}]`)
        }
      })
    }

    console.log('Final weekly medicines:', weeklyMedicines)
    setDailyMedicines(weeklyMedicines)
  }, [schedules, dailyMedicinesMap])

  // Auto-update missed medicines (with 30-minute grace period)
  useEffect(() => {
    const updateMissedMedicines = async () => {
      if (!user?.uid || dailyMedicines.length === 0) return

      const today = new Date().toISOString().split('T')[0]
      const now = new Date()

      for (const medicine of dailyMedicines) {
        // Only check medicines that are still "upcoming" and for today
        if (medicine.status === "upcoming" && medicine.date === today) {
          const [hours, minutes] = medicine.time.split(':').map(Number)
          const medicineTime = new Date()
          medicineTime.setHours(hours, minutes, 0, 0)

          // Add 30-minute grace period before marking as missed
          const gracePeriodMs = 30 * 60 * 1000 // 30 minutes in milliseconds
          const missedThreshold = medicineTime.getTime() + gracePeriodMs

          // Only mark as missed if grace period has passed
          if (now.getTime() > missedThreshold) {
            try {
              // Check if this is a generated medicine (needs new record) or existing record
              if (medicine.id.includes('-') && !medicine.id.startsWith('daily_')) {
                // Create new daily medicine record with missed status
                const dailyMedicine = {
                  scheduleId: medicine.scheduleId,
                  date: medicine.date,
                  status: "missed"
                }
                await addDoc(collection(firestore, `users/${user.uid}/daily_medicines`), dailyMedicine)
              } else {
                // Update existing daily medicine record
                const medicineRef = doc(firestore, `users/${user.uid}/daily_medicines`, medicine.id)
                await updateDoc(medicineRef, { status: "missed" })
              }
            } catch (error) {
              console.error("Error updating missed medicine:", error)
            }
          }
        }
      }
    }

    const interval = setInterval(updateMissedMedicines, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [dailyMedicines, user?.uid])

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
        name: newSchedule.name,
        time: newSchedule.time,
        dosage: newSchedule.dosage,
        days: newSchedule.days,
        status: "active",
        createdAt: Timestamp.now(),
        notes: newSchedule.notes
      }

      await addDoc(collection(firestore, `users/${user.uid}/medicine_schedules`), schedule)
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
      const scheduleRef = doc(firestore, `users/${user.uid}/medicine_schedules`, editingSchedule.id)
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
      await deleteDoc(doc(firestore, `users/${user.uid}/medicine_schedules`, scheduleId))
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

  const updateMedicineStatus = async (medicine: DailyMedicine, newStatus: "taken" | "missed" | "upcoming") => {
    if (!user?.uid) {
      toast.error("User not authenticated")
      return
    }

    try {
      // Check if daily medicine record exists
      if (medicine.id.includes('-') && !medicine.id.startsWith('daily_')) {
        // Create new daily medicine record
        const dailyMedicine = {
          scheduleId: medicine.scheduleId,
          date: medicine.date,
          status: newStatus,
          ...(newStatus === "taken" && { takenAt: Timestamp.now() })
        }

        await addDoc(collection(firestore, `users/${user.uid}/daily_medicines`), dailyMedicine)
      } else {
        // Update existing daily medicine record
        const medicineRef = doc(firestore, `users/${user.uid}/daily_medicines`, medicine.id)
        const updateData: any = { status: newStatus }

        if (newStatus === "taken") {
          updateData.takenAt = Timestamp.now()
        } else if (newStatus === "upcoming") {
          // Remove takenAt when marking as upcoming
          updateData.takenAt = null
        }

        await updateDoc(medicineRef, updateData)
      }

      const statusMessages = {
        taken: "Marked as taken!",
        missed: "Marked as missed!",
        upcoming: "Reset to upcoming!"
      }

      toast.success(statusMessages[newStatus])
    } catch (error: any) {
      console.error("Error updating medicine status:", error)
      toast.error(`Failed to update medicine status: ${error.message}`)
    }
  }

  const markMedicineAsTaken = (medicine: DailyMedicine) => updateMedicineStatus(medicine, "taken")
  const markMedicineAsMissed = (medicine: DailyMedicine) => updateMedicineStatus(medicine, "missed")
  const markMedicineAsUpcoming = (medicine: DailyMedicine) => updateMedicineStatus(medicine, "upcoming")

  // Helper function to check if medicine is for today
  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
  }

  // Helper function to check if medicine time has passed
  const isTimePassed = (timeString: string) => {
    const now = new Date()
    const [hours, minutes] = timeString.split(':').map(Number)
    const medicineTime = new Date()
    medicineTime.setHours(hours, minutes, 0, 0)
    return now > medicineTime
  }

  // Helper function to check if grace period has passed (30 minutes after scheduled time)
  const isGracePeriodPassed = (timeString: string) => {
    const now = new Date()
    const [hours, minutes] = timeString.split(':').map(Number)
    const medicineTime = new Date()
    medicineTime.setHours(hours, minutes, 0, 0)

    const gracePeriodMs = 30 * 60 * 1000 // 30 minutes in milliseconds
    const missedThreshold = medicineTime.getTime() + gracePeriodMs

    return now.getTime() > missedThreshold
  }

  // Helper function to get the actual status of a medicine (considering time passed with grace period)
  const getActualStatus = (medicine: DailyMedicine) => {
    // If already taken or explicitly missed, return as is
    if (medicine.status === "taken" || medicine.status === "missed") {
      return medicine.status
    }

    // If it's upcoming but for today and grace period has passed, it's missed
    if (medicine.status === "upcoming" && isToday(medicine.date) && isGracePeriodPassed(medicine.time)) {
      return "missed"
    }

    return medicine.status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "taken":
        return "bg-gradient-to-br from-green-50 to-green-100 text-green-800 border-green-300 shadow-sm"
      case "upcoming":
        return "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 border-blue-300 shadow-sm"
      case "missed":
        return "bg-gradient-to-br from-red-50 to-red-100 text-red-800 border-red-300 shadow-sm"
      default:
        return "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border-gray-300 shadow-sm"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "taken":
        return <Check className="h-4 w-4 text-green-600" />
      case "upcoming":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "missed":
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
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
    const filtered = dailyMedicines.filter(med => {
      // Direct date comparison is more reliable
      return med.date === dateString
    })

    // Debug logging
    console.log(`Getting medicines for ${dayName} (${dateString}):`, filtered)
    console.log('All daily medicines:', dailyMedicines)

    return filtered
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
        {/* Today's Summary */}
        {(() => {
          const today = new Date().toISOString().split('T')[0]
          const todaysMedicines = dailyMedicines.filter(med => med.date === today)
          const upcomingCount = todaysMedicines.filter(med => getActualStatus(med) === "upcoming").length
          const takenCount = todaysMedicines.filter(med => getActualStatus(med) === "taken").length
          const missedCount = todaysMedicines.filter(med => getActualStatus(med) === "missed").length

          if (todaysMedicines.length > 0) {
            return (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-700">{upcomingCount}</div>
                  <div className="text-sm text-blue-600 font-medium">Upcoming</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
                  <div className="flex items-center justify-center mb-2">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-700">{takenCount}</div>
                  <div className="text-sm text-green-600 font-medium">Taken</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm">
                  <div className="flex items-center justify-center mb-2">
                    <X className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-700">{missedCount}</div>
                  <div className="text-sm text-red-600 font-medium">Missed</div>
                </div>
              </div>
            )
          }
          return null
        })()}

        {/* Today's Medicines Quick Actions */}
        {(() => {
          const today = new Date().toISOString().split('T')[0]
          const todaysMedicines = dailyMedicines.filter(med => med.date === today)

          if (todaysMedicines.length > 0) {
            return (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Today's Medicines
                </h4>
                <div className="space-y-2">
                  {todaysMedicines.map((medicine) => {
                    const actualStatus = getActualStatus(medicine)
                    return (
                      <div key={medicine.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${getStatusColor(actualStatus).split(' ')[0]} ${getStatusColor(actualStatus).split(' ')[1]}`}>
                            {getStatusIcon(actualStatus)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{medicine.name}</div>
                            <div className="text-xs text-gray-500">{medicine.time} • {medicine.dosage}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant={actualStatus === "upcoming" ? "default" : "outline"}
                            onClick={() => markMedicineAsUpcoming(medicine)}
                            className="text-xs px-2 py-1 h-7"
                          >
                            Upcoming
                          </Button>
                          <Button
                            size="sm"
                            variant={actualStatus === "taken" ? "default" : "outline"}
                            onClick={() => markMedicineAsTaken(medicine)}
                            className="text-xs px-2 py-1 h-7 bg-green-600 hover:bg-green-700 text-white"
                          >
                            Taken
                          </Button>
                          <Button
                            size="sm"
                            variant={actualStatus === "missed" ? "default" : "outline"}
                            onClick={() => markMedicineAsMissed(medicine)}
                            className="text-xs px-2 py-1 h-7 bg-red-600 hover:bg-red-700 text-white"
                          >
                            Missed
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }
          return null
        })()}

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
          <div className="grid grid-cols-7 gap-3">
            {getWeekDates().map((day, index) => {
              const dayMedicines = getMedicinesForDay(day.dayName, day.date.toISOString().split('T')[0])
              return (
                <div key={index} className="space-y-2 min-h-[160px] p-2 bg-gray-50 rounded-lg border">
                  <div className="text-xs font-medium text-gray-600 text-center mb-2">
                    {dayMedicines.length} medicine{dayMedicines.length !== 1 ? 's' : ''}
                  </div>
                  {dayMedicines.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-gray-400">
                      <div className="text-center">
                        <Pill className="h-6 w-6 mx-auto mb-1 opacity-50" />
                        <div className="text-xs">No medicines</div>
                      </div>
                    </div>
                  ) : (
                    dayMedicines.map((medicine) => {
                    const actualStatus = getActualStatus(medicine)
                    const isCurrentDay = isToday(medicine.date)
                    return (
                      <div
                        key={medicine.id}
                        className={`p-3 border rounded-lg text-xs relative transition-all hover:shadow-md ${getStatusColor(actualStatus)}`}
                      >
                        <div className="font-semibold truncate text-sm mb-1">{medicine.name}</div>
                        <div className="text-xs opacity-75 mb-1">{medicine.time}</div>
                        <div className="text-xs opacity-75 mb-2">{medicine.dosage}</div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(actualStatus)}
                            <span className="text-xs font-medium capitalize">{actualStatus}</span>
                          </div>

                          {/* Status Control Buttons */}
                          {isCurrentDay && (
                            <div className="flex gap-1">
                              {actualStatus !== "taken" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-green-200 rounded-full"
                                  onClick={() => markMedicineAsTaken(medicine)}
                                  title="Mark as taken"
                                >
                                  <Check className="h-3 w-3 text-green-600" />
                                </Button>
                              )}
                              {actualStatus !== "missed" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-red-200 rounded-full"
                                  onClick={() => markMedicineAsMissed(medicine)}
                                  title="Mark as missed"
                                >
                                  <X className="h-3 w-3 text-red-600" />
                                </Button>
                              )}
                              {actualStatus !== "upcoming" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-blue-200 rounded-full"
                                  onClick={() => markMedicineAsUpcoming(medicine)}
                                  title="Reset to upcoming"
                                >
                                  <Clock className="h-3 w-3 text-blue-600" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Show taken time if medicine was taken */}
                        {medicine.takenAt && actualStatus === "taken" && (
                          <div className="text-xs text-green-600 mt-1 opacity-75">
                            Taken: {medicine.takenAt instanceof Timestamp
                              ? medicine.takenAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Unknown'}
                          </div>
                        )}
                      </div>
                    )
                  })
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Medicine Schedules List */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 text-lg">All Medicine Schedules</h4>
            <div className="text-sm text-gray-500">
              {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
            </div>
          </div>
          {schedules.length > 0 ? (
            schedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between p-5 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                    <Pill className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{schedule.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {schedule.time}
                      </p>
                      <p className="text-sm text-gray-600">
                        {schedule.dosage}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {schedule.days.map(day => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ')}
                      </p>
                      <Badge variant={schedule.status === "active" ? "default" : "secondary"} className="text-xs">
                        {schedule.status}
                      </Badge>
                    </div>
                    {schedule.notes && (
                      <p className="text-xs text-gray-500 italic mt-1 bg-gray-50 px-2 py-1 rounded">{schedule.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(schedule)} className="hover:bg-blue-50">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteSchedule(schedule.id)} className="hover:bg-red-50 text-red-600">
                    <Trash2 className="h-4 w-4" />
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
