import { doc, setDoc, getDoc } from "firebase/firestore"
import { firestore } from "./firebase"

/**
 * Test utility to set Bluetooth status for a specific user
 * This is for testing purposes only
 */
export const setUserBluetoothStatus = async (userId: string, bluetoothStatus: boolean) => {
  try {
    const userDocRef = doc(firestore, "users", userId)
    
    // Check if user document exists
    const userDoc = await getDoc(userDocRef)
    
    if (userDoc.exists()) {
      // Update existing user document
      await setDoc(userDocRef, { bluetooth: bluetoothStatus }, { merge: true })
      console.log(`Bluetooth status updated for user ${userId}: ${bluetoothStatus}`)
    } else {
      // Create new user document with Bluetooth status
      await setDoc(userDocRef, {
        bluetooth: bluetoothStatus,
        createdAt: Date.now(),
        lastUpdated: Date.now()
      })
      console.log(`New user document created for ${userId} with Bluetooth status: ${bluetoothStatus}`)
    }
    
    return { success: true, message: `Bluetooth status set to ${bluetoothStatus}` }
  } catch (error) {
    console.error("Error setting Bluetooth status:", error)
    return { success: false, error: error }
  }
}

/**
 * Get Bluetooth status for a specific user
 */
export const getUserBluetoothStatus = async (userId: string) => {
  try {
    const userDocRef = doc(firestore, "users", userId)
    const userDoc = await getDoc(userDocRef)
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return {
        success: true,
        bluetoothStatus: userData?.bluetooth,
        userData: userData
      }
    } else {
      return {
        success: false,
        message: "User document not found"
      }
    }
  } catch (error) {
    console.error("Error getting Bluetooth status:", error)
    return { success: false, error: error }
  }
}

/**
 * Test function to simulate Bluetooth status changes
 * Call this from browser console to test the functionality
 */
export const testBluetoothToggle = async (userId: string = "rXbXkdGAHugddhy6hpu0jC9zRBq2") => {
  console.log("Testing Bluetooth status toggle...")
  
  // Get current status
  const currentStatus = await getUserBluetoothStatus(userId)
  console.log("Current status:", currentStatus)
  
  if (currentStatus.success) {
    // Toggle the status
    const newStatus = !currentStatus.bluetoothStatus
    const result = await setUserBluetoothStatus(userId, newStatus)
    console.log("Toggle result:", result)
    
    // Wait a moment and check again
    setTimeout(async () => {
      const updatedStatus = await getUserBluetoothStatus(userId)
      console.log("Updated status:", updatedStatus)
    }, 1000)
  } else {
    // Set initial status to false to trigger the popup
    const result = await setUserBluetoothStatus(userId, false)
    console.log("Initial setup result:", result)
  }
}

// Make functions available globally for testing
if (typeof window !== "undefined") {
  (window as any).testBluetoothToggle = testBluetoothToggle
  (window as any).setUserBluetoothStatus = setUserBluetoothStatus
  (window as any).getUserBluetoothStatus = getUserBluetoothStatus
}
