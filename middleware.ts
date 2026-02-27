import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if maintenance mode is enabled via environment variable
  // In Vercel Edge Runtime, use request.headers for environment variables
  const maintenanceMode = 
    process.env.MAINTENANCE_MODE === 'true' ||
    request.headers.get('x-maintenance-mode') === 'true';
  
  // If maintenance mode is disabled, continue normally
  if (!maintenanceMode) {
    return NextResponse.next();
  }
  
  // Allow access to maintenance page itself
  if (request.nextUrl.pathname === '/maintenance') {
    return NextResponse.next();
  }
  
  // Allow access to static files and API routes (optional - remove if you want to block everything)
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/uploads') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }
  
  // Redirect all other requests to maintenance page
  return NextResponse.rewrite(new URL('/maintenance', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
