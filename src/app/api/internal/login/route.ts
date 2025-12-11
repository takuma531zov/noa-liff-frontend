import { createSessionToken } from '@/lib/internalAuth/token'
import { NextResponse } from 'next/server'

// 管理ログインAPI（Cookieベース）
export async function POST(request: Request) {
  const { user, password } = (await request.json()) as {
    user?: string
    password?: string
    remember?: boolean
  }

  const expectedUser = process.env.INTERNAL_BASIC_USER
  const expectedPass = process.env.INTERNAL_BASIC_PASSWORD

  if (!expectedUser || !expectedPass) {
    return NextResponse.json({ error: '環境変数が未設定です' }, { status: 500 })
  }

  if (
    !user ||
    !password ||
    user !== expectedUser ||
    password !== expectedPass
  ) {
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 })
  }

  const token = await createSessionToken(14)
  const res = NextResponse.json({ success: true })
  res.cookies.set('internal_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 14 * 24 * 60 * 60,
    path: '/',
  })
  return res
}
