# 🔵 Bluetooth Heart Rate Testing Guide

This guide explains how to test the Bluetooth-based heart rate functionality in the VocalEyes Health Dashboard.

## 🎯 Overview

The dashboard now includes Bluetooth status monitoring that:
- Checks Firebase Firestore for user's Bluetooth status when "Start Live" is clicked
- Shows dynamic heart rate (75-95 BPM) when Bluetooth is ON and live monitoring is active
- Displays a popup dialog "Connect to watch" when trying to start live monitoring with Bluetooth OFF
- Provides visual indicators for connection status on Start Live buttons
- Only allows live heart rate monitoring when Bluetooth is connected

## 🔧 Testing Setup

### 1. Firebase Configuration
Ensure your Firebase project has:
- Firestore Database enabled
- User document structure: `users/{userId}`
- Bluetooth field: `bluetooth: boolean`

### 2. Test User ID
The system is configured to monitor user: `rXbXkdGAHugddhy6hpu0jC9zRBq2`

## 🧪 Testing Methods

### Method 1: Browser Console Testing
1. Open the dashboard in your browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Use these commands:

```javascript
// Test the Start Live button functionality (recommended)
testStartLiveButton()

// Quick enable Bluetooth for testing
enableBluetoothForTesting()

// Quick disable Bluetooth to test popup
disableBluetoothForTesting()

// Test Bluetooth toggle functionality
testBluetoothToggle()

// Set Bluetooth to ON (true)
setUserBluetoothStatus("rXbXkdGAHugddhy6hpu0jC9zRBq2", true)

// Set Bluetooth to OFF (false)
setUserBluetoothStatus("rXbXkdGAHugddhy6hpu0jC9zRBq2", false)

// Check current Bluetooth status
getUserBluetoothStatus("rXbXkdGAHugddhy6hpu0jC9zRBq2")
```

### Method 2: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database
4. Find the user document: `users/rXbXkdGAHugddhy6hpu0jC9zRBq2`
5. Add/edit the `bluetooth` field:
   - `true` for connected
   - `false` for disconnected

## 📱 Expected Behavior

### When "Start Live" is clicked with Bluetooth = true (Connected)
- ✅ Live monitoring starts immediately
- ✅ Heart rate displays between 75-95 BPM in real-time
- ✅ Dynamic heart rate changes every 1.5 seconds
- ✅ Blue "Connected" indicator appears
- ✅ Chart updates with live data
- ✅ Console logs: "Starting live heart rate monitoring with Bluetooth connection"

### When "Start Live" is clicked with Bluetooth = false (Disconnected)
- ❌ Popup dialog appears: "Connect to watch"
- ❌ Live monitoring does NOT start
- ❌ Red "Disconnected" indicator shows on Start Live button
- ❌ Button shows BluetoothOff icon and "(Bluetooth Required)" text
- ❌ Tooltip shows: "Connect your smartwatch via Bluetooth to start live monitoring"

### When "Start Live" is clicked with Bluetooth = null (Unknown)
- ⏳ Nothing happens (button click ignored)
- ⏳ Console logs: "Bluetooth status is still loading..."
- ⏳ System waits for Firebase data

### Background Behavior (when live monitoring is OFF)
- 🔵 **Bluetooth ON**: Background heart rate updates every 3 seconds (75-95 BPM)
- 🔴 **Bluetooth OFF**: Static heart rate display
- ⚪ **Bluetooth NULL**: Static heart rate display

## 🎨 Visual Indicators

### Connection Status Badge
Located in the "Live Heart Rate" section:
- **Connected**: Blue badge with Bluetooth icon
- **Disconnected**: Red badge with BluetoothOff icon (clickable)
- **Checking**: Gray badge with loading animation

### Heart Rate Display
- **Bluetooth ON**: Shows `dynamicHeartRate` (75-95 BPM)
- **Bluetooth OFF**: Shows `fitHeartRate` or `currentHeartRate`

### Popup Dialog
- **Title**: "Connect to Watch"
- **Description**: Instructions to enable Bluetooth
- **Actions**: "Connect Watch" and "Dismiss" buttons
- **Note**: Warning about simulated data

## 🔄 Real-time Updates

The system uses Firebase real-time listeners:
- Changes in Firestore are reflected immediately
- No page refresh required
- Smooth animations for status changes

## 🐛 Troubleshooting

### Common Issues

1. **No popup appears when Bluetooth = false**
   - Check browser console for Firebase errors
   - Verify user document exists in Firestore
   - Ensure correct user ID is being used

2. **Heart rate doesn't change when Bluetooth = true**
   - Check if `bluetoothStatus` state is updating
   - Verify the dynamic heart rate interval is running
   - Look for JavaScript errors in console

3. **Firebase connection issues**
   - Verify Firebase configuration in `.env.local`
   - Check Firestore security rules
   - Ensure user is authenticated

### Debug Commands

```javascript
// Check current state
console.log("Bluetooth Status:", bluetoothStatus)
console.log("Dynamic Heart Rate:", dynamicHeartRate)
console.log("Show Dialog:", showBluetoothDialog)

// Force dialog to show
setShowBluetoothDialog(true)

// Check Firebase connection
firebase.firestore().enableNetwork()
```

## 📊 Heart Rate Patterns

### Bluetooth Connected (75-95 BPM)
- Base rate: 85 BPM
- Sine wave variation: ±8 BPM
- Random variation: ±3 BPM
- Update interval: 1.5 seconds
- Range: Clamped to 75-95 BPM

### Bluetooth Disconnected (60-100 BPM)
- Base rate: 75 BPM
- Sine wave variation: ±10 BPM
- Random variation: ±4 BPM
- Update interval: 2 seconds
- Range: Clamped to 60-100 BPM

## 🚀 Production Deployment

For production use:
1. Remove the test utility import from `dashboard.tsx`
2. Remove the `bluetooth-test.ts` file
3. Implement actual Bluetooth device integration
4. Add proper error handling for device disconnections
5. Consider adding user preferences for Bluetooth monitoring

## 📝 Notes

- This implementation is for demonstration purposes
- Real Bluetooth integration would require additional APIs
- Heart rate patterns simulate realistic human variations
- All animations use Framer Motion for smooth transitions
- Firebase security rules should restrict access to user's own data

---

**Test the functionality and verify all features work as expected before deploying to production.**
