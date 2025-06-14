"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu } from "lucide-react"
import type { User } from "firebase/auth"

interface PageHeaderProps {
  user: User
  title: string
  description: string
  setSidebarOpen: (open: boolean) => void
}

export default function PageHeader({ user, title, description, setSidebarOpen }: PageHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <p className="text-sm text-gray-500">
              {description}
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
            <p className="text-sm font-medium">
              {user.displayName || user.email?.split("@")[0]}
            </p>
            <p className="text-xs text-gray-500">Health Enthusiast</p>
          </div>
        </div>
      </div>
    </header>
  )
}
