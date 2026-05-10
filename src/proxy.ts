import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/infrastructure/supabase/middleware'

export async function proxy(request: NextRequest) {
    const dataSource = process.env.DATA_SOURCE

    if (dataSource === 'SUPABASE') {
        return updateSession(request)
    }

    const response = NextResponse.next()
    const sessionCookie = request.cookies.get('kyber_session')
    const path = request.nextUrl.pathname

    const isProtectedRoute =
        path.startsWith('/dashboard') ||
        path.startsWith('/market') ||
        path.startsWith('/purchases') ||
        path.startsWith('/profile')

    const isAuthRoute = path.startsWith('/auth')

    if (isProtectedRoute && !sessionCookie) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (isAuthRoute && sessionCookie) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
