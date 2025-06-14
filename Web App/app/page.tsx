"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { initializeUserInFirestore } from "@/lib/user-initialization"
import AuthPage from "@/components/auth-page"
import HomePage from "@/components/home-page"
import type { User } from "firebase/auth"

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Ensure user data is initialized in Firestore
          await initializeUserInFirestore(user)
        } catch (error) {
          console.error("Error initializing user data:", error)
        }
      }
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return user ? <HomePage user={user} /> : <AuthPage />
}
