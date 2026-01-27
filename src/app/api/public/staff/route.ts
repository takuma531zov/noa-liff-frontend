import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

// キャッシュ無効化（スタッフ追加時に即時反映するため）
export const dynamic = 'force-dynamic'

// 公開スタッフ一覧API（最小フィールド・is_active=trueのみ）
export async function GET() {
  const supabase = createServiceClient()
  // デバッグ: is_activeフィルタなしで全件取得
  const { data: allData } = await supabase
    .from('staff')
    .select('id,name,stores,is_active,created_at')
    .order('created_at', { ascending: true })

  const { data, error } = await supabase
    .from('staff')
    .select('id,name,stores')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })

  // ブラウザ/CDNキャッシュを無効化
  const filteredIds = new Set(data?.map((s) => s.id) ?? [])
  const response = NextResponse.json({
    staff: data ?? [],
    _debug: {
      totalCount: allData?.length ?? 0,
      filteredCount: data?.length ?? 0,
      allStaff: allData?.map((s) => ({
        name: s.name,
        is_active: s.is_active,
        created_at: s.created_at,
        inFiltered: filteredIds.has(s.id),
      })),
    },
  })
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return response
}
