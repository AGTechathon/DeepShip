"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import type { User } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BluetoothDebugProps {
  user: User
}

export default function BluetoothDebug({ user }: BluetoothDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkUserDocument = async () => {
    if (!user?.uid) return

    setLoading(true)
    try {
      const userDocRef = doc(firestore, "users", user.uid)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setDebugInfo({
          exists: true,
          data: userData,
          BluetoothEnabled: userData?.BluetoothEnabled,
          bluetooth: userData?.bluetooth,
          timestamp: new Date().toISOString()
        })
      } else {
        setDebugInfo({
          exists: false,
          message: "User document does not exist",
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      setDebugInfo({
        error: true,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const createTestDocument = async () => {
    if (!user?.uid) return

    setLoading(true)
    try {
      const userDocRef = doc(firestore, "users", user.uid)
      await setDoc(userDocRef, {
        BluetoothEnabled: true,
        bluetooth: true,
        email: user.email,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        testDocument: true
      }, { merge: true })
      
      console.log("Test document created successfully")
      await checkUserDocument()
    } catch (error) {
      console.error("Error creating test document:", error)
      setDebugInfo({
        error: true,
        message: `Error creating document: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleBluetoothEnabled = async (value: boolean) => {
    if (!user?.uid) return

    setLoading(true)
    try {
      const userDocRef = doc(firestore, "users", user.uid)
      await setDoc(userDocRef, {
        BluetoothEnabled: value,
        bluetooth: value,
        lastUpdated: Date.now()
      }, { merge: true })
      
      console.log(`BluetoothEnabled set to: ${value}`)
      await checkUserDocument()
    } catch (error) {
      console.error("Error updating BluetoothEnabled:", error)
      setDebugInfo({
        error: true,
        message: `Error updating: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkUserDocument()
  }, [user?.uid])

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>🔧 BluetoothEnabled Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={checkUserDocument} disabled={loading}>
            🔍 Check Document
          </Button>
          <Button onClick={createTestDocument} disabled={loading}>
            📄 Create Test Doc
          </Button>
          <Button onClick={() => toggleBluetoothEnabled(true)} disabled={loading}>
            ✅ Enable Bluetooth
          </Button>
          <Button onClick={() => toggleBluetoothEnabled(false)} disabled={loading}>
            ❌ Disable Bluetooth
          </Button>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">User Info:</h3>
          <p><strong>UID:</strong> {user?.uid}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Firebase Path:</strong> users/{user?.uid}</p>
        </div>

        {debugInfo && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Expected Behavior:</h3>
          <ul className="text-sm space-y-1">
            <li>• When BluetoothEnabled = true → Green "Pulse ON" indicator</li>
            <li>• When BluetoothEnabled = false → Red "Pulse OFF" indicator</li>
            <li>• When document doesn't exist → Gray "Checking..." indicator</li>
            <li>• Check browser console for detailed logs</li>
          </ul>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Processing...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
