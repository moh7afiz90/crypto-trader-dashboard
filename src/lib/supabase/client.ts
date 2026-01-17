import { createBrowserClient } from '@supabase/ssr'
import type { Environment } from '@/contexts/environment-context'

// Environment-specific Supabase configuration
const supabaseConfig = {
  production: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  staging: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
}

// Get environment from cookie (client-side)
function getEnvironmentFromCookie(): Environment {
  if (typeof document === 'undefined') return 'staging'

  const cookies = document.cookie.split(';')
  const envCookie = cookies.find(c => c.trim().startsWith('selected-environment='))

  if (envCookie) {
    const value = envCookie.split('=')[1]?.trim()
    if (value === 'production' || value === 'staging') {
      return value
    }
  }

  return (process.env.NEXT_PUBLIC_DEFAULT_ENV as Environment) || 'staging'
}

// Create client for specific environment
export function createClientForEnv(environment: Environment) {
  const config = supabaseConfig[environment]
  return createBrowserClient(config.url, config.anonKey)
}

// Create client using current environment from cookie
export function createClient() {
  const environment = getEnvironmentFromCookie()
  return createClientForEnv(environment)
}

// Export config for debugging
export function getSupabaseConfig(environment: Environment) {
  return {
    url: supabaseConfig[environment].url,
    // Don't expose full key, just first/last chars for debugging
    anonKeyPreview: supabaseConfig[environment].anonKey
      ? `${supabaseConfig[environment].anonKey.slice(0, 10)}...${supabaseConfig[environment].anonKey.slice(-10)}`
      : 'not set',
  }
}
