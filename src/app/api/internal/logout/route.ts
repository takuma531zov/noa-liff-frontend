import { NextResponse } from 'next/server'

// 管理ログアウトAPI（セッションクッキー無効化）
export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('internal_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return res
}

