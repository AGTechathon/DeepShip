"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { initializeUserInFirestore } from "@/lib/user-initialization"
import type { User } from "firebase/auth"

interface AuthProviderProps {
  children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Ensure user data is initialized in Firestore
          await initializeUserInFirestore(user)
          setUser(user)
          
          // Redirect to dashboard if user is on a public route
          if (isPublicRoute) {
            router.push('/dashboard')
          }
        } catch (error) {
          console.error("Error initializing user data:", error)
          setUser(user) // Still set user even if initialization fails
        }
      } else {
        setUser(null)
        // Redirect to login if user is not authenticated and not on a public route
        if (!isPublicRoute) {
          router.push('/login')
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router, pathname, isPublicRoute])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // If user is not authenticated and trying to access protected route, show loading
  if (!user && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return <>{children}</>
}
