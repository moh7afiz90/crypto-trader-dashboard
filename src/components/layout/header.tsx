'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'
import { Button } from '@/components/ui/button'
import { LogOut, TrendingUp } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User | null
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        {/* Mobile Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold">Crypto Trader</span>
        </div>

        {/* Desktop: Page Title placeholder */}
        <div className="hidden md:block" />

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
