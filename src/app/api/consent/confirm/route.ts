import {
  encryptLineDisplayName,
  encryptLineUserId,
} from '@/lib/crypto/customerFields'
import {
  createReservationConfirmMessage,
  sendLineMessage,
} from '@/lib/line/messaging'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

// 同意確認入力型
type ConsentConfirmInput = {
  token: string
  lineUserId: string
  lineDisplayName: string
}

// 同意処理API
export async function POST(request: Request) {
  const { token, lineUserId, lineDisplayName } =
    (await request.json()) as ConsentConfirmInput

  if (!token || !lineUserId || !lineDisplayName) {
    return NextResponse.json(
      { error: '必要な情報が不足しています' },
      { status: 400 },
    )
  }

  const supabase = createServiceClient()

  // consent_tokenで予約情報を取得
  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('*')
    .eq('consent_token', token)
    .single()

  if (fetchError || !reservation) {
    return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
  }

  // 既に同意済みの場合
  if (reservation.consent) {
    return NextResponse.json(
      { error: 'この予約は既に同意済みです' },
      { status: 400 },
    )
  }

  // 予約情報を更新（LINEユーザー情報を暗号化して保存）
  const encUserId = await encryptLineUserId(lineUserId)
  const encDisplay = await encryptLineDisplayName(lineDisplayName)

  if (!encUserId.ok || !encDisplay.ok) {
    return NextResponse.json(
      { error: '同意データの暗号化に失敗しました' },
      { status: 500 },
    )
  }

  const { error: updateError } = await supabase
    .from('reservations')
    .update({
      line_user_id: encUserId.value,
      line_display_name: encDisplay.value,
      consent: true,
      status: 'confirmed',
    })
    .eq('id', reservation.id)

  if (updateError) {
    return NextResponse.json(
      { error: '予約の更新に失敗しました' },
      { status: 500 },
    )
  }

  // LINEで予約確認メッセージを送信
  const messageText = createReservationConfirmMessage({
    displayName: lineDisplayName,
    store: reservation.store,
    reservationDate: reservation.reservation_date,
    reservationTime: reservation.reservation_time,
    staffName: reservation.staff_name_snapshot,
    menu: reservation.menu,
  })

  // 担当者公式LINEリンクを取得（staff_idがある場合のみ）
  const { data: staff, error: staffErr } = reservation.staff_id
    ? await supabase
        .from('staff')
        .select('official_line_url')
        .eq('id', reservation.staff_id)
        .eq('is_active', true)
        .single()
    : { data: null, error: null }

  await sendLineMessage({
    to: lineUserId,
    messages: [
      {
        type: 'text',
        text: messageText,
      },
    ],
    staffOfficialLineUrl: staffErr
      ? undefined
      : (staff?.official_line_url ?? undefined),
  })

  return NextResponse.json({
    success: true,
    message: '同意が完了しました',
  })
}
