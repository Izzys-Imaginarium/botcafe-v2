import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isBackroomsRoute = createRouteMatcher(['/backrooms(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get('host') || ''
  const hostname = host.split(':')[0]

  // Detect backrooms subdomain
  let isBackrooms = false
  if (hostname.startsWith('backrooms.')) {
    isBackrooms = true
  } else if (hostname.endsWith('.localhost') && hostname.split('.')[0] === 'backrooms') {
    isBackrooms = true
  }

  if (isBackrooms) {
    const pathname = req.nextUrl.pathname

    // Allow auth-related paths through without auth check (prevents redirect loop)
    const isAuthPath = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')

    // Require auth for backrooms (except auth pages themselves)
    if (!isAuthPath) {
      const { userId } = await auth()
      if (!userId) {
        const signInUrl = new URL('/sign-in', req.url)
        signInUrl.searchParams.set('redirect_url', req.url)
        return NextResponse.redirect(signInUrl)
      }
    }

    // Rewrite root and non-backrooms paths to /backrooms internally
    const url = req.nextUrl.clone()
    if (!pathname.startsWith('/backrooms') && !pathname.startsWith('/api') && !isAuthPath && !pathname.startsWith('/_next') && !pathname.startsWith('/admin')) {
      url.pathname = `/backrooms${url.pathname === '/' ? '' : url.pathname}`
      const response = NextResponse.rewrite(url)
      response.cookies.set('subdomain', 'backrooms', { path: '/' })
      return response
    }

    const response = NextResponse.next()
    response.cookies.set('subdomain', 'backrooms', { path: '/' })
    return response
  }

  // Block direct access to /backrooms routes on main domain
  if (isBackroomsRoute(req)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Clear subdomain cookie on main domain
  const response = NextResponse.next()
  response.cookies.delete('subdomain')
  return response
})

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}
