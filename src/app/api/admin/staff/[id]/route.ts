import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

// 管理: スタッフ更新/論理削除
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params
  const { name, stores, official_line_url } = (await request.json()) as {
    name?: string
    stores?: string[]
    official_line_url?: string | null
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('staff')
    .update({ name, stores, official_line_url: official_line_url ?? null })
    .eq('id', id)

  if (error)
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('staff')
    .update({ is_active: false })
    .eq('id', id)

  if (error)
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  return NextResponse.json({ success: true })
}
