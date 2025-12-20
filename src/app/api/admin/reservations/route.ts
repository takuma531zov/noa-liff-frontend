import {
  decryptCustomerName,
  decryptLineDisplayName,
} from '@/lib/crypto/customerFields'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

// 管理: 予約一覧（line_user_id/consent_token は非返却）
export async function GET(request: Request) {
  const url = new URL(request.url)
  const date = url.searchParams.get('date') || ''
  const staffId = url.searchParams.get('staff_id') || ''

  if (!date || !staffId) {
    return NextResponse.json(
      { error: 'パラメータが不足しています' },
      { status: 400 },
    )
  }

  const supabase = createServiceClient()
  const base = supabase
    .from('reservations')
    .select('*')
    .eq('reservation_date', date)
    .order('reservation_time', { ascending: true })

  const { data, error } = await (staffId === '__none__'
    ? base.is('staff_id', null)
    : base.eq('staff_id', staffId))

  if (error)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })

  const sanitized = await Promise.all(
    (data ?? []).map(async (r) => {
      const name = r.customer_name
        ? await decryptCustomerName(r.customer_name)
        : ({ ok: true, value: null } as const)
      const display = r.line_display_name
        ? await decryptLineDisplayName(r.line_display_name)
        : ({ ok: true, value: null } as const)

      return {
        id: r.id,
        store: r.store,
        staff_id: r.staff_id,
        staff_name_snapshot: r.staff_name_snapshot,
        menu: r.menu,
        reservation_date: r.reservation_date,
        reservation_time: r.reservation_time,
        customer_name: name.ok ? name.value : null,
        line_display_name: display.ok ? display.value : null,
        consent: r.consent,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }
    }),
  )

  return NextResponse.json({ reservations: sanitized })
}
