import { NextResponse, type NextRequest } from 'next/server'
import { verifySessionToken } from '@/lib/internalAuth/token'

// 管理UI/APIをCookieでガード
const protectedPaths = [
  '/staff',
  '/reservations',
  '/api/admin',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 保護対象判定（/api/admin は配下すべて）
  const isProtected =
    pathname === '/staff' ||
    pathname === '/reservations' ||
    pathname.startsWith('/api/admin')

  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get('internal_session')?.value || ''
  const ok = token ? await verifySessionToken(token) : false

  if (ok) return NextResponse.next()

  // API と ページで応答を分ける
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/internal/login', req.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico).*)'],
}

