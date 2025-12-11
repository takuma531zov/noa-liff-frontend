import { createClient } from '@supabase/supabase-js'

// Service Role用Supabaseクライアント（サーバ専用）
// 注意: ブラウザからは絶対に使用しないこと
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase環境変数が不足しています')
  }

  // サーバ専用クライアント（Service Role）
  return createClient(supabaseUrl, serviceKey)
}
