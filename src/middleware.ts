import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type Environment = 'staging' | 'production'

// Environment-specific Supabase configuration (must match client.ts and server.ts)
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

// Get environment from request cookies
function getEnvironmentFromRequest(request: NextRequest): Environment {
  const envCookie = request.cookies.get('selected-environment')

  if (envCookie?.value === 'production' || envCookie?.value === 'staging') {
    return envCookie.value
  }

  return DEFAULT_ENVIRONMENT
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Get the selected environment from cookies
  const environment = getEnvironmentFromRequest(request)
  const config = supabaseConfig[environment]

  const supabase = createServerClient(
    config.url,
    config.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define public routes that don't require authentication
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/')
  const isPublicRoute = isLoginPage || isAuthCallback

  // Redirect to login if not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
