import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

const DEFAULT_ENVIRONMENT: Environment =
  (process.env.NEXT_PUBLIC_DEFAULT_ENV as Environment) || 'staging'

// Get environment from cookies (server-side)
async function getServerEnvironment(): Promise<Environment> {
  const cookieStore = await cookies()
  const envCookie = cookieStore.get('selected-environment')

  if (envCookie?.value === 'production' || envCookie?.value === 'staging') {
    return envCookie.value
  }

  return DEFAULT_ENVIRONMENT
}

// Create server client for specific environment
export async function createClientForEnv(environment: Environment) {
  const cookieStore = await cookies()
  const config = supabaseConfig[environment]

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  })
}

// Create server client using current environment from cookies
export async function createClient() {
  const environment = await getServerEnvironment()
  return createClientForEnv(environment)
}

// Get current environment (useful for server components)
export { getServerEnvironment }
