"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import LiveLocation from "@/components/live-location"
import PageHeader from "@/components/page-header"
import type { User } from "firebase/auth"

export default function LocationPage() {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })

    return () => unsubscribe()
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        user={user}
        title="Live Location"
        description="Track and monitor your real-time location for safety and health insights."
        setSidebarOpen={setSidebarOpen}
      />
      <main className="p-6">
        <LiveLocation user={user} />
      </main>
    </>
  )
}
