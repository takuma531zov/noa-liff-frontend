import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

// キャッシュ無効化（スタッフ追加時に即時反映するため）
export const dynamic = 'force-dynamic'

// 公開スタッフ一覧API（最小フィールド・is_active=trueのみ）
export async function GET() {
  const supabase = createServiceClient()
  // デバッグ: .eq() vs .is() の比較
  const { data: eqData } = await supabase
    .from('staff')
    .select('id,name')
    .eq('is_active', true)

  const { data: isData } = await supabase
    .from('staff')
    .select('id,name')
    .is('is_active', true)

  const { data, error } = await supabase
    .from('staff')
    .select('id,name,stores')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })

  // ブラウザ/CDNキャッシュを無効化
  const response = NextResponse.json({
    staff: data ?? [],
    _debug: {
      eqCount: eqData?.length ?? 0,
      isCount: isData?.length ?? 0,
      eqNames: eqData?.map((s) => s.name),
      isNames: isData?.map((s) => s.name),
    },
  })
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return response
}
