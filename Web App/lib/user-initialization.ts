import { doc, setDoc, getDoc } from "firebase/firestore"
import { firestore } from "./firebase"
import type { User } from "firebase/auth"

export interface UserData {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  createdAt: number
  lastLoginAt: number
  profile: {
    name: string
    email: string
    phone?: string
    dateOfBirth?: string
    gender?: string
    emergencyContact?: {
      name: string
      phone: string
      relationship: string
    }
  }
  preferences: {
    notifications: boolean
    emailAlerts: boolean
    theme: "light" | "dark" | "system"
    language: string
  }
}

export const initializeUserInFirestore = async (user: User): Promise<void> => {
  try {
    const userDocRef = doc(firestore, "users", user.uid)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      // Create new user document
      const userData: UserData = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        profile: {
          name: user.displayName || "",
          email: user.email || "",
        },
        preferences: {
          notifications: true,
          emailAlerts: true,
          theme: "system",
          language: "en",
        },
      }

      await setDoc(userDocRef, userData)
      console.log("User initialized in Firestore:", user.uid)
    } else {
      // Update last login time for existing user
      await setDoc(userDocRef, { lastLoginAt: Date.now() }, { merge: true })
      console.log("User login time updated:", user.uid)
    }
  } catch (error) {
    console.error("Error initializing user in Firestore:", error)
    throw error
  }
}

export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDocRef = doc(firestore, "users", uid)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      return userDoc.data() as UserData
    }
    return null
  } catch (error) {
    console.error("Error getting user data:", error)
    return null
  }
}

export const updateUserProfile = async (uid: string, profileData: Partial<UserData["profile"]>): Promise<void> => {
  try {
    const userDocRef = doc(firestore, "users", uid)
    await setDoc(userDocRef, { profile: profileData }, { merge: true })
    console.log("User profile updated:", uid)
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

export const updateUserPreferences = async (uid: string, preferences: Partial<UserData["preferences"]>): Promise<void> => {
  try {
    const userDocRef = doc(firestore, "users", uid)
    await setDoc(userDocRef, { preferences }, { merge: true })
    console.log("User preferences updated:", uid)
  } catch (error) {
    console.error("Error updating user preferences:", error)
    throw error
  }
}
