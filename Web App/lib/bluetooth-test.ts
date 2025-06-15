import { doc, setDoc, getDoc } from "firebase/firestore"
import { firestore } from "./firebase"

/**
 * Test utility to set BluetoothEnabled status for a specific user
 * This is for testing purposes only
 */
export const setUserBluetoothStatus = async (userId: string, bluetoothStatus: boolean) => {
  try {
    const userDocRef = doc(firestore, "users", userId)

    // Check if user document exists
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      // Update existing user document with BluetoothEnabled field
      await setDoc(userDocRef, {
        BluetoothEnabled: bluetoothStatus,
        bluetooth: bluetoothStatus, // Keep backward compatibility
        lastUpdated: Date.now()
      }, { merge: true })
      console.log(`BluetoothEnabled status updated for user ${userId}: ${bluetoothStatus}`)
    } else {
      // Create new user document with BluetoothEnabled status
      await setDoc(userDocRef, {
        BluetoothEnabled: bluetoothStatus,
        bluetooth: bluetoothStatus, // Keep backward compatibility
        createdAt: Date.now(),
        lastUpdated: Date.now()
      })
      console.log(`New user document created for ${userId} with BluetoothEnabled status: ${bluetoothStatus}`)
    }

    return { success: true, message: `BluetoothEnabled status set to ${bluetoothStatus}` }
  } catch (error) {
    console.error("Error setting BluetoothEnabled status:", error)
    return { success: false, error: error }
  }
}

/**
 * Get BluetoothEnabled status for a specific user
 */
export const getUserBluetoothStatus = async (userId: string) => {
  try {
    const userDocRef = doc(firestore, "users", userId)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()

      // Check BluetoothEnabled field first, fallback to bluetooth for compatibility
      const bluetoothEnabled = userData?.BluetoothEnabled !== undefined
        ? userData?.BluetoothEnabled
        : userData?.bluetooth

      return {
        success: true,
        bluetoothStatus: bluetoothEnabled,
        BluetoothEnabled: userData?.BluetoothEnabled,
        bluetooth: userData?.bluetooth,
        userData: userData
      }
    } else {
      return {
        success: false,
        message: "User document not found"
      }
    }
  } catch (error) {
    console.error("Error getting BluetoothEnabled status:", error)
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
  console.log("📱 Test 1: Setting BluetoothEnabled to FALSE")
  await setUserBluetoothStatus(userId, false)
  console.log("✅ BluetoothEnabled set to false - Click 'Start Live' button now")
  console.log("Expected: Popup should appear saying 'Connect to watch'")
  console.log("Expected: Pulse Rate indicator should show 'Pulse OFF'")

  // Wait 5 seconds then test with Bluetooth on
  setTimeout(async () => {
    console.log("\n📱 Test 2: Setting BluetoothEnabled to TRUE")
    await setUserBluetoothStatus(userId, true)
    console.log("✅ BluetoothEnabled set to true - Click 'Start Live' button now")
    console.log("Expected: Live monitoring should start with heart rate 75-110 BPM")
    console.log("Expected: Pulse Rate indicator should show 'Pulse ON'")

    // Wait another 5 seconds then show current status
    setTimeout(async () => {
      const status = await getUserBluetoothStatus(userId)
      console.log("\n📊 Current Status:", status)
      console.log("🔄 You can now test the Start Live button functionality!")
    }, 2000)
  }, 5000)
}

/**
 * Quick test to set BluetoothEnabled ON for live monitoring
 */
export const enableBluetoothForTesting = async (userId: string = "rXbXkdGAHugddhy6hpu0jC9zRBq2") => {
  console.log("🔵 Enabling BluetoothEnabled for testing...")
  const result = await setUserBluetoothStatus(userId, true)
  console.log("✅ BluetoothEnabled = true - You can now start live monitoring")
  console.log("✅ Pulse Rate indicator should show 'Pulse ON'")
  return result
}

/**
 * Quick test to set BluetoothEnabled OFF to test popup
 */
export const disableBluetoothForTesting = async (userId: string = "rXbXkdGAHugddhy6hpu0jC9zRBq2") => {
  console.log("🔴 Disabling BluetoothEnabled for testing...")
  const result = await setUserBluetoothStatus(userId, false)
  console.log("❌ BluetoothEnabled = false - Click 'Start Live' to see popup")
  console.log("❌ Pulse Rate indicator should show 'Pulse OFF'")
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
