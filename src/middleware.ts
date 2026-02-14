
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/infrastructure/supabase/middleware'

export async function middleware(request: NextRequest) {
    const dataSource = process.env.DATA_SOURCE;

    // SUPABASE MODE: Delegate to Supabase Middleware
    if (dataSource === 'SUPABASE') {
        return await updateSession(request)
    }

    // MEMORY / MOCK MODE: Custom Simple Auth
    const response = NextResponse.next();
    const sessionCookie = request.cookies.get('kyber_session');
    const path = request.nextUrl.pathname;

    // Define protected routes pattern
    const isProtectedRoute =
        path.startsWith('/dashboard') ||
        path.startsWith('/market') ||
        path.startsWith('/purchases') ||
        path.startsWith('/profile');

    const isAuthRoute = path.startsWith('/auth');

    // REDIRECT LOGIC
    if (isProtectedRoute && !sessionCookie) {
        // Protected route but no session -> Login
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (isAuthRoute && sessionCookie) {
        // Auth route but already logged in -> Dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images/assets 
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
