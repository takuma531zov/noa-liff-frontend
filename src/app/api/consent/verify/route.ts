import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// トークン検証API
export async function POST(request: Request) {
  const { token } = (await request.json()) as { token: string }

  if (!token) {
    return NextResponse.json({ error: 'トークンが必要です' }, { status: 400 })
  }

  const supabase = await createClient()

  // consent_tokenで予約情報を取得
  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('consent_token', token)
    .single()

  if (error || !reservation) {
    return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
  }

  // 既に同意済みの場合
  if (reservation.consent) {
    return NextResponse.json(
      { error: 'この予約は既に同意済みです' },
      { status: 400 },
    )
  }

  // キャンセル済みの場合
  if (reservation.status === 'cancelled') {
    return NextResponse.json(
      { error: 'この予約はキャンセルされています' },
      { status: 400 },
    )
  }

  return NextResponse.json({ reservation })
}
