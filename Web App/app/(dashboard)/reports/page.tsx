"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import HealthReports from "@/components/health-reports"
import PageHeader from "@/components/page-header"
import type { User } from "firebase/auth"

export default function ReportsPage() {
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
        title="Health Reports"
        description="View and download your comprehensive health reports and analytics."
        setSidebarOpen={setSidebarOpen}
      />
      <main className="p-6">
        <HealthReports user={user} />
      </main>
    </>
  )
}
