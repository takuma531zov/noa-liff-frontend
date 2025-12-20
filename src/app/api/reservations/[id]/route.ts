import {
  decryptCustomerName,
  decryptLineDisplayName,
  decryptLineUserId,
  encryptCustomerName,
} from '@/lib/crypto/customerFields'
import {
  createReservationChangeMessage,
  sendLineMessage,
} from '@/lib/line/messaging'
import { createServiceClient } from '@/lib/supabase/service'
import type { UpdateReservationInput } from '@/lib/supabase/types'
import { NextResponse } from 'next/server'

// 予約更新API
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createServiceClient()
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
  const nextStaffId = willChangeStaffId
    ? (body.staff_id ?? null)
    : before.staff_id
  const nextStaffNameSnapshot = willChangeStaffId
    ? nextStaffId
      ? (
          await supabase
            .from('staff')
            .select('name')
            .eq('id', nextStaffId)
            .eq('is_active', true)
            .single()
        ).data?.name || '指名無し'
      : '指名無し'
    : before.staff_name_snapshot

  // 顧客名の暗号化（更新がある場合のみ）
  const nextCustomerEnc = Object.prototype.hasOwnProperty.call(
    body,
    'customer_name',
  )
    ? body.customer_name
      ? await encryptCustomerName(body.customer_name)
      : ({ ok: true, value: null } as const)
    : ({ ok: true, value: before.customer_name } as const)

  if (!nextCustomerEnc.ok) {
    return NextResponse.json(
      { error: '顧客名の暗号化に失敗しました' },
      { status: 500 },
    )
  }

  const { data, error } = await supabase
    .from('reservations')
    .update({
      store: body.store,
      staff_id: nextStaffId,
      staff_name_snapshot: nextStaffNameSnapshot,
      menu: body.menu,
      reservation_date: body.reservation_date,
      reservation_time: body.reservation_time,
      customer_name: nextCustomerEnc.value,
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
    normalizeTime(before.reservation_time) !==
      normalizeTime(data.reservation_time)

  if (canNotify && hasDiff) {
    const displayNameRes = data.line_display_name
      ? await decryptLineDisplayName(data.line_display_name)
      : ({ ok: true, value: 'お客様' } as const)
    const displayName =
      displayNameRes.ok && displayNameRes.value
        ? displayNameRes.value
        : 'お客様'

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

    const toRes = await decryptLineUserId(String(before.line_user_id))
    const toId = toRes.ok ? toRes.value : ''

    if (toId) {
      await sendLineMessage({
        to: toId,
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
    }
  }

  return NextResponse.json({
    success: true,
    reservation: {
      id: data.id,
      store: data.store,
      staff_id: data.staff_id,
      staff_name_snapshot: data.staff_name_snapshot,
      menu: data.menu,
      reservation_date: data.reservation_date,
      reservation_time: data.reservation_time,
      customer_name: await (async () => {
        if (!data.customer_name) return null
        const r = await decryptCustomerName(String(data.customer_name))
        return r.ok ? r.value : null
      })(),
      line_display_name: await (async () => {
        const r = data.line_display_name
          ? await decryptLineDisplayName(String(data.line_display_name))
          : ({ ok: true, value: null } as const)
        return r.ok ? r.value : null
      })(),
      consent: data.consent,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
  })
}

// 予約キャンセルAPI
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createServiceClient()
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
