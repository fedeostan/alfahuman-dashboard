import { auth } from '@/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  if (
    !isLoggedIn &&
    (pathname.startsWith('/dashboard') || pathname.startsWith('/envios') || pathname.startsWith('/shipments'))
  ) {
    return Response.redirect(new URL('/', req.url))
  }
  if (isLoggedIn && pathname === '/') {
    return Response.redirect(new URL('/dashboard', req.url))
  }
})

export const config = {
  matcher: ['/', '/dashboard/:path*', '/envios/:path*', '/shipments/:path*'],
}
