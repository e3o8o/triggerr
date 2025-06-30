import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  try {
    // Handle anonymous session management
    let anonymousSessionId = request.cookies.get('anonymous-session-id')?.value;

    // Create anonymous session if none exists
    if (!anonymousSessionId) {
      anonymousSessionId = `anon_${crypto.randomUUID()}`;
      response.cookies.set('anonymous-session-id', anonymousSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    // Set anonymous session header for API routes
    if (pathname.startsWith('/api/') && anonymousSessionId) {
      response.headers.set('x-anonymous-session-id', anonymousSessionId);
    }

    // Allow auth routes to pass through
    if (pathname.startsWith('/api/auth/')) {
      return response;
    }

    // Allow public API routes
    const publicRoutes = [
      '/api/v1/chat/message',
      '/api/v1/insurance/quote',
      '/api/v1/insurance/products',
      '/api/v1/policy/track',
    ];

    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return response;
    }

    // Note: Route protection will be handled by individual API routes
    // since we can't reliably check auth status in edge middleware
    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
