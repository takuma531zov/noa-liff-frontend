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
