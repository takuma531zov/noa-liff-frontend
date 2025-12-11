import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// 管理: スタッフ一覧/追加
export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  return NextResponse.json({ staff: data ?? [] })
}

export async function POST(request: Request) {
  const { name, stores, official_line_url } = (await request.json()) as {
    name?: string
    stores?: string[]
    official_line_url?: string | null
  }

  if (!name || !Array.isArray(stores)) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('staff').insert([
    { name, stores, official_line_url: official_line_url ?? null, is_active: true },
  ])

  if (error) return NextResponse.json({ error: '追加に失敗しました' }, { status: 500 })
  return NextResponse.json({ success: true })
}

