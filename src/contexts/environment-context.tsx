'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

export type Environment = 'staging' | 'production'

interface EnvironmentContextType {
  environment: Environment
  setEnvironment: (env: Environment) => void
  isProduction: boolean
  isStaging: boolean
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined)

const ENVIRONMENT_COOKIE_NAME = 'selected-environment'
const DEFAULT_ENVIRONMENT: Environment =
  (process.env.NEXT_PUBLIC_DEFAULT_ENV as Environment) || 'staging'

function getEnvironmentFromCookie(): Environment {
  if (typeof document === 'undefined') return DEFAULT_ENVIRONMENT

  const cookies = document.cookie.split(';')
  const envCookie = cookies.find(c => c.trim().startsWith(`${ENVIRONMENT_COOKIE_NAME}=`))

  if (envCookie) {
    const value = envCookie.split('=')[1]?.trim()
    if (value === 'production' || value === 'staging') {
      return value
    }
  }

  return DEFAULT_ENVIRONMENT
}

function setEnvironmentCookie(env: Environment) {
  if (typeof document === 'undefined') return

  // Set cookie with 1 year expiry
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `${ENVIRONMENT_COOKIE_NAME}=${env};path=/;expires=${expires.toUTCString()}`
}

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironmentState] = useState<Environment>(DEFAULT_ENVIRONMENT)
  const [mounted, setMounted] = useState(false)

  // Read from cookie on mount
  useEffect(() => {
    setEnvironmentState(getEnvironmentFromCookie())
    setMounted(true)
  }, [])

  const setEnvironment = useCallback((env: Environment) => {
    setEnvironmentState(env)
    setEnvironmentCookie(env)
    // Refresh the page to ensure server components use new environment
    window.location.reload()
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <EnvironmentContext.Provider
      value={{
        environment,
        setEnvironment,
        isProduction: environment === 'production',
        isStaging: environment === 'staging',
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext)
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider')
  }
  return context
}

// Helper to get environment on server side (from cookies)
export function getServerEnvironment(cookieHeader: string | null): Environment {
  if (!cookieHeader) return DEFAULT_ENVIRONMENT

  const cookies = cookieHeader.split(';')
  const envCookie = cookies.find(c => c.trim().startsWith(`${ENVIRONMENT_COOKIE_NAME}=`))

  if (envCookie) {
    const value = envCookie.split('=')[1]?.trim()
    if (value === 'production' || value === 'staging') {
      return value
    }
  }

  return DEFAULT_ENVIRONMENT
}
