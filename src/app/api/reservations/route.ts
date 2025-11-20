import { createClient } from '@/lib/supabase/server'
import type { CreateReservationInput } from '@/lib/supabase/types'
import { NextResponse } from 'next/server'

// 予約登録API
export async function POST(request: Request) {
  const supabase = await createClient()

  // リクエストボディを取得
  const body = (await request.json()) as CreateReservationInput

  // バリデーション
  if (
    !body.store ||
    !body.staff_name ||
    !body.menu ||
    !body.reservation_date ||
    !body.reservation_time
  ) {
    return NextResponse.json(
      { error: '必須項目が不足しています' },
      { status: 400 },
    )
  }

  // consent_token生成（ランダムなUUID）
  const consentToken = crypto.randomUUID()

  // 予約データを保存
  const { data, error } = await supabase
    .from('reservations')
    .insert([
      {
        store: body.store,
        staff_name: body.staff_name,
        menu: body.menu,
        reservation_date: body.reservation_date,
        reservation_time: body.reservation_time,
        customer_name: body.customer_name || null,
        consent_token: consentToken,
        consent: false,
        status: 'pending',
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('予約登録エラー:', error)
    return NextResponse.json(
      { error: '予約の登録に失敗しました' },
      { status: 500 },
    )
  }

  // 同意リンクURLを生成
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const consentUrl = `${baseUrl}/liff/consent?token=${consentToken}`

  return NextResponse.json({
    success: true,
    reservationId: data.id,
    consentUrl,
  })
}
