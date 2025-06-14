import { doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import type { User } from "firebase/auth"

// User profile interface
export interface UserProfile {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  createdAt: number
  lastLoginAt: number
  isProfileComplete: boolean
  preferences: {
    notifications: boolean
    darkMode: boolean
    language: string
    timezone: string
  }
  healthProfile: {
    age: number | null
    gender: string | null
    height: number | null // in cm
    weight: number | null // in kg
    bloodType: string | null
    allergies: string[]
    medicalConditions: string[]
    emergencyContact: {
      name: string | null
      phone: string | null
      relationship: string | null
    }
  }
}

// Medicine alert interface
export interface MedicineAlert {
  id?: string
  name: string
  time: string
  dosage: string
  status: "taken" | "missed" | "upcoming"
  date: string
  createdAt: number
  userId: string
  frequency: "daily" | "weekly" | "monthly" | "as-needed"
  notes?: string
  reminderEnabled: boolean
}

// Health report interface
export interface HealthReport {
  id?: string
  userId: string
  reportType: "daily" | "weekly" | "monthly"
  generatedAt: number
  data: {
    steps: number
    heartRate: {
      average: number
      minimum: number
      maximum: number
      readings: Array<{ time: string; rate: number }>
    }
    location: {
      totalDistance: number
      placesVisited: number
      timeSpent: number
    }
    medications: {
      taken: number
      missed: number
      total: number
      adherenceRate: number
    }
    sleepData?: {
      duration: number
      quality: "poor" | "fair" | "good" | "excellent"
    }
    mood?: {
      rating: number // 1-10
      notes: string
    }
  }
  insights: string[]
  recommendations: string[]
}

// Location history interface
export interface LocationHistory {
  id?: string
  userId: string
  lat: number
  lng: number
  timestamp: string
  address?: string
  accuracy?: number
  source: "manual" | "automatic" | "gps"
}

// Dashboard settings interface
export interface DashboardSettings {
  userId: string
  layout: {
    widgets: Array<{
      id: string
      type: string
      position: { x: number; y: number }
      size: { width: number; height: number }
      visible: boolean
    }>
  }
  preferences: {
    refreshInterval: number // in seconds
    showNotifications: boolean
    compactMode: boolean
  }
  lastUpdated: number
}

/**
 * Initialize user data structure in Firestore
 */
export async function initializeUserInFirestore(user: User): Promise<void> {
  try {
    console.log("Initializing user in Firestore:", user.uid)

    // Check if user already exists
    const userDocRef = doc(firestore, "users", user.uid)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      console.log("User already exists, updating last login")
      // Update last login time
      await setDoc(userDocRef, {
        lastLoginAt: Date.now()
      }, { merge: true })
      return
    }

    // Create user profile document
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      isProfileComplete: false,
      preferences: {
        notifications: true,
        darkMode: false,
        language: "en",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      healthProfile: {
        age: null,
        gender: null,
        height: null,
        weight: null,
        bloodType: null,
        allergies: [],
        medicalConditions: [],
        emergencyContact: {
          name: null,
          phone: null,
          relationship: null
        }
      }
    }

    // Create user profile document
    await setDoc(userDocRef, userProfile)

    // Initialize dashboard settings
    const dashboardSettings: DashboardSettings = {
      userId: user.uid,
      layout: {
        widgets: [
          { id: "heart-rate", type: "heart-rate", position: { x: 0, y: 0 }, size: { width: 2, height: 1 }, visible: true },
          { id: "steps", type: "steps", position: { x: 2, y: 0 }, size: { width: 1, height: 1 }, visible: true },
          { id: "location", type: "location", position: { x: 0, y: 1 }, size: { width: 2, height: 1 }, visible: true },
          { id: "medications", type: "medications", position: { x: 2, y: 1 }, size: { width: 1, height: 1 }, visible: true }
        ]
      },
      preferences: {
        refreshInterval: 30,
        showNotifications: true,
        compactMode: false
      },
      lastUpdated: Date.now()
    }

    await setDoc(doc(firestore, "dashboardSettings", user.uid), dashboardSettings)

    // Create initial collections with sample data
    await createInitialCollections(user.uid)

    console.log("User initialization completed successfully")

  } catch (error) {
    console.error("Error initializing user in Firestore:", error)
    throw error
  }
}

/**
 * Create initial collections and sample data for new user
 */
async function createInitialCollections(userId: string): Promise<void> {
  try {
    // Create Medicine Alerts collection with welcome message
    const medicineAlertsRef = collection(firestore, "Medicine Alerts")
    await addDoc(medicineAlertsRef, {
      name: "Welcome to HealthPulse!",
      time: "09:00",
      dosage: "Getting started",
      status: "upcoming",
      date: new Date().toISOString().split("T")[0],
      createdAt: Date.now(),
      userId: userId,
      frequency: "daily",
      notes: "This is a sample alert. You can delete it and add your own medications.",
      reminderEnabled: true
    } as MedicineAlert)

    // Create Location History collection
    const locationHistoryRef = collection(firestore, "locationHistory")
    await addDoc(locationHistoryRef, {
      userId: userId,
      lat: 17.613409,
      lng: 75.891103,
      timestamp: new Date().toISOString(),
      address: "Sample Location - Welcome to HealthPulse!",
      accuracy: 10,
      source: "manual"
    } as LocationHistory)

    // Create Health Reports collection
    const healthReportsRef = collection(firestore, "healthReports")
    await addDoc(healthReportsRef, {
      userId: userId,
      reportType: "daily",
      generatedAt: Date.now(),
      data: {
        steps: 0,
        heartRate: {
          average: 75,
          minimum: 60,
          maximum: 90,
          readings: []
        },
        location: {
          totalDistance: 0,
          placesVisited: 0,
          timeSpent: 0
        },
        medications: {
          taken: 0,
          missed: 0,
          total: 1,
          adherenceRate: 0
        }
      },
      insights: ["Welcome to HealthPulse! Start tracking your health data."],
      recommendations: ["Add your medications", "Enable location tracking", "Set up your health profile"]
    } as HealthReport)

    console.log("Initial collections created successfully")

  } catch (error) {
    console.error("Error creating initial collections:", error)
    throw error
  }
}

/**
 * Check if user exists in Firestore
 */
export async function checkUserExists(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(firestore, "users", userId)
    const userDoc = await getDoc(userDocRef)
    return userDoc.exists()
  } catch (error) {
    console.error("Error checking if user exists:", error)
    return false
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(firestore, "users", userId)
    const userDoc = await getDoc(userDocRef)
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile
    }
    return null
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}
