import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

// キャッシュ無効化（スタッフ追加時に即時反映するため）
export const dynamic = 'force-dynamic'

// 公開スタッフ一覧API（最小フィールド・is_active=trueのみ）
export async function GET() {
  const supabase = createServiceClient()
  // 全件取得してJS側でフィルタ（Supabaseのクエリキャッシュ問題を回避）
  const { data, error } = await supabase
    .from('staff')
    .select('id,name,stores,is_active')
    .order('name', { ascending: true })

  if (error)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })

  // is_active=trueのみフィルタしてis_activeフィールドを除外
  const activeStaff = (data ?? [])
    .filter((s) => s.is_active === true)
    .map(({ id, name, stores }) => ({ id, name, stores }))

  // ブラウザ/CDNキャッシュを無効化
  const response = NextResponse.json({
    staff: activeStaff,
    _debug: { totalFromDB: data?.length, allNames: data?.map((s) => s.name) },
  })
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return response
}
