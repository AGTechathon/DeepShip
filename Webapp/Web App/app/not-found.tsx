import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            VocalEyes
          </h1>
        </div>

        <div className="mb-8">
          <h2 className="text-6xl font-bold text-gray-900 mb-4">404</h2>
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
          
          <div className="text-sm text-gray-500">
            <Link href="/login" className="text-purple-600 hover:underline">
              Sign In
            </Link>
            {" • "}
            <Link href="/signup" className="text-purple-600 hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
