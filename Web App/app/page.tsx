"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

<<<<<<< HEAD
export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [googleFitToken, setGoogleFitToken] = useState<string | null>(null)
=======
export default function HomePage() {
  const router = useRouter()
>>>>>>> 1834c8f461346230af92998bdd5568c2ddc956ea

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard')
      } else {
        // User is not authenticated, redirect to login
        router.push('/login')
      }
    })

    return () => unsubscribe()
  }, [router])

<<<<<<< HEAD
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return user ? <HomePage user={user} googleFitToken={googleFitToken} /> : <AuthPage setGoogleFitToken={setGoogleFitToken} />
=======
  // Show loading while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
    </div>
  )
>>>>>>> 1834c8f461346230af92998bdd5568c2ddc956ea
}
