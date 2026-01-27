import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

// キャッシュ無効化（スタッフ追加時に即時反映するため）
export const dynamic = 'force-dynamic'

// 公開スタッフ一覧API（最小フィールド・is_active=trueのみ）
export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('staff')
    .select('id,name,stores')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  return NextResponse.json({ staff: data ?? [] })
}
