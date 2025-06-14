"use client"

import { useState } from "react"
import type { User } from "firebase/auth"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, BarChart3, FileText, Bell, MapPin, LogOut, Menu, X } from "lucide-react"
import Dashboard from "@/components/dashboard"
import HealthReports from "@/components/health-reports"
import MedicineAlerts from "@/components/medicine-alerts"
import LiveLocation from "@/components/live-location"

interface HomePageProps {
  user: User
  googleFitToken: string | null
}

type ActivePage = "dashboard" | "reports" | "alerts" | "location"

export default function HomePage({ user, googleFitToken }: HomePageProps) {
  const [activePage, setActivePage] = useState<ActivePage>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "reports", label: "Health Reports", icon: FileText },
    { id: "alerts", label: "Medicine Alerts", icon: Bell },
    { id: "location", label: "Live Location", icon: MapPin },
  ]

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard user={user} googleFitToken={googleFitToken} />
      case "reports":
        return <HealthReports user={user} />
      case "alerts":
        return <MedicineAlerts user={user} />
      case "location":
        return <LiveLocation user={user} />
      default:
        return <Dashboard user={user} googleFitToken={googleFitToken} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                HealthPulse
              </h1>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activePage === item.id ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  activePage === item.id
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    : "hover:bg-purple-50"
                }`}
                onClick={() => {
                  setActivePage(item.id as ActivePage)
                  setSidebarOpen(false)
                }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 bg-gray-50 rounded-lg mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName || user.email?.split("@")[0]}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {activePage === "dashboard"
                    ? "Overview Of Your Health"
                    : activePage === "reports"
                      ? "Health Reports"
                      : activePage === "alerts"
                        ? "Medicine Alerts"
                        : "Live Location"}
                </h2>
                <p className="text-sm text-gray-500">
                  {activePage === "dashboard"
                    ? "Harmonious Living Balance, Strength, Vitality, Wellness."
                    : `Manage your ${activePage}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user.displayName || user.email?.split("@")[0]}</p>
                <p className="text-xs text-gray-500">Health Enthusiast</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{renderContent()}</main>
      </div>
    </div>
  )
}
