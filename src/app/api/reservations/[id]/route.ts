import {
  createReservationChangeMessage,
  sendLineMessage,
} from '@/lib/line/messaging'
import { createClient } from '@/lib/supabase/server'
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
  // staff_id の変更がある場合はスナップショットを更新
  const willChangeStaffId = Object.prototype.hasOwnProperty.call(
    body,
    'staff_id',
  )
  const nextStaffId = willChangeStaffId ? (body.staff_id ?? null) : before.staff_id
  const nextStaffNameSnapshot = willChangeStaffId
    ? (nextStaffId
        ? (
            await supabase
              .from('staff')
              .select('name')
              .eq('id', nextStaffId)
              .eq('is_active', true)
              .single()
          ).data?.name || '指名無し'
        : '指名無し')
    : before.staff_name_snapshot

  const { data, error } = await supabase
    .from('reservations')
    .update({
      store: body.store,
      staff_id: nextStaffId,
      staff_name_snapshot: nextStaffNameSnapshot,
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

  // 時刻比較のためにHH:MMへ正規化
  const normalizeTime = (t: string | null | undefined) => (t ?? '').slice(0, 5)

  // 実質的な変更（通知対象フィールド）があるか判定（時間は正規化して比較）
  const hasDiff =
    before.store !== data.store ||
    before.staff_name_snapshot !== data.staff_name_snapshot ||
    before.menu !== data.menu ||
    before.reservation_date !== data.reservation_date ||
    normalizeTime(before.reservation_time) !== normalizeTime(data.reservation_time)

  if (canNotify && hasDiff) {
    const displayName = data.line_display_name || 'お客様'

    const messageText = createReservationChangeMessage({
      displayName,
      before: {
        store: before.store,
        reservationDate: before.reservation_date,
        reservationTime: before.reservation_time,
        staffName: before.staff_name_snapshot,
        menu: before.menu,
      },
      after: {
        store: data.store,
        reservationDate: data.reservation_date,
        reservationTime: data.reservation_time,
        staffName: data.staff_name_snapshot,
        menu: data.menu,
      },
    })

    // 担当者公式LINEリンク（変更後の担当者IDで取得）
    const { data: staff, error: staffErr } = data.staff_id
      ? await supabase
          .from('staff')
          .select('official_line_url')
          .eq('id', data.staff_id)
          .eq('is_active', true)
          .single()
      : { data: null, error: null }

    await sendLineMessage({
      to: before.line_user_id as string,
      messages: [
        {
          type: 'text',
          text: messageText,
        },
      ],
      staffOfficialLineUrl: staffErr ? undefined : staff?.official_line_url ?? undefined,
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
