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

/**
 * Test the Start Live button functionality
 * This function helps test the specific requirement
 */
export const testStartLiveButton = async (userId: string = "rXbXkdGAHugddhy6hpu0jC9zRBq2") => {
  console.log("🧪 Testing Start Live Button Functionality")
  console.log("==========================================")

  // Test 1: Set Bluetooth to false and try to start live
  console.log("📱 Test 1: Setting Bluetooth to FALSE")
  await setUserBluetoothStatus(userId, false)
  console.log("✅ Bluetooth set to false - Click 'Start Live' button now")
  console.log("Expected: Popup should appear saying 'Connect to watch'")

  // Wait 5 seconds then test with Bluetooth on
  setTimeout(async () => {
    console.log("\n📱 Test 2: Setting Bluetooth to TRUE")
    await setUserBluetoothStatus(userId, true)
    console.log("✅ Bluetooth set to true - Click 'Start Live' button now")
    console.log("Expected: Live monitoring should start with heart rate 75-95 BPM")

    // Wait another 5 seconds then show current status
    setTimeout(async () => {
      const status = await getUserBluetoothStatus(userId)
      console.log("\n📊 Current Status:", status)
      console.log("🔄 You can now test the Start Live button functionality!")
    }, 2000)
  }, 5000)
}

/**
 * Quick test to set Bluetooth ON for live monitoring
 */
export const enableBluetoothForTesting = async (userId: string = "rXbXkdGAHugddhy6hpu0jC9zRBq2") => {
  console.log("🔵 Enabling Bluetooth for testing...")
  const result = await setUserBluetoothStatus(userId, true)
  console.log("✅ Bluetooth enabled - You can now start live monitoring")
  return result
}

/**
 * Quick test to set Bluetooth OFF to test popup
 */
export const disableBluetoothForTesting = async (userId: string = "rXbXkdGAHugddhy6hpu0jC9zRBq2") => {
  console.log("🔴 Disabling Bluetooth for testing...")
  const result = await setUserBluetoothStatus(userId, false)
  console.log("❌ Bluetooth disabled - Click 'Start Live' to see popup")
  return result
}

// Make functions available globally for testing
if (typeof window !== "undefined") {
  (window as any).testBluetoothToggle = testBluetoothToggle
  (window as any).testStartLiveButton = testStartLiveButton
  (window as any).enableBluetoothForTesting = enableBluetoothForTesting
  (window as any).disableBluetoothForTesting = disableBluetoothForTesting
  (window as any).setUserBluetoothStatus = setUserBluetoothStatus
  (window as any).getUserBluetoothStatus = getUserBluetoothStatus
}
