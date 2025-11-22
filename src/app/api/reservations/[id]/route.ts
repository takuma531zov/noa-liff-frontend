import { createClient } from '@/lib/supabase/server'
import {
  createReservationChangeMessage,
  sendLineMessage,
} from '@/lib/line/messaging'
import type { UpdateReservationInput } from '@/lib/supabase/types'
import { NextResponse } from 'next/server'

// 予約更新API
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const { id } = params

  // リクエストボディを取得
  const body = (await request.json()) as UpdateReservationInput

  // 更新前の予約情報を取得
  const { data: before, error: fetchError } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !before) {
    console.error('予約取得エラー:', fetchError)
    return NextResponse.json(
      { error: '予約の取得に失敗しました' },
      { status: 404 },
    )
  }

  // 予約を更新
  const { data, error } = await supabase
    .from('reservations')
    .update({
      store: body.store,
      staff_name: body.staff_name,
      menu: body.menu,
      reservation_date: body.reservation_date,
      reservation_time: body.reservation_time,
      customer_name: body.customer_name || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('予約更新エラー:', error)
    return NextResponse.json(
      { error: '予約の更新に失敗しました' },
      { status: 500 },
    )
  }

  // 変更通知の送信条件を満たす場合のみ送信
  const canNotify = Boolean(before.consent && before.line_user_id)

  // 実質的な変更（通知対象フィールド）があるか判定
  const hasDiff =
    before.store !== data.store ||
    before.staff_name !== data.staff_name ||
    before.menu !== data.menu ||
    before.reservation_date !== data.reservation_date ||
    before.reservation_time !== data.reservation_time

  if (canNotify && hasDiff) {
    const displayName = data.line_display_name || 'お客様'

    const messageText = createReservationChangeMessage({
      displayName,
      before: {
        store: before.store,
        reservationDate: before.reservation_date,
        reservationTime: before.reservation_time,
        staffName: before.staff_name,
        menu: before.menu,
      },
      after: {
        store: data.store,
        reservationDate: data.reservation_date,
        reservationTime: data.reservation_time,
        staffName: data.staff_name,
        menu: data.menu,
      },
    })

    await sendLineMessage({
      to: before.line_user_id as string,
      messages: [
        {
          type: 'text',
          text: messageText,
        },
      ],
    })
  }

  return NextResponse.json({
    success: true,
    reservation: data,
  })
}

// 予約キャンセルAPI
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const { id } = params

  // ステータスを'cancelled'に更新（論理削除）
  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) {
    console.error('予約キャンセルエラー:', error)
    return NextResponse.json(
      { error: '予約のキャンセルに失敗しました' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
  })
}
