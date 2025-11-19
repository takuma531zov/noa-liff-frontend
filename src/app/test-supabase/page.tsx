'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

// Supabase接続テストページ
export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('接続中...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      const supabase = createClient()

      // 接続テスト（healthチェック）
      const { data, error: fetchError } = await supabase
        .from('reservations')
        .select('count')
        .limit(1)

      if (fetchError) {
        // テーブルが存在しない場合は正常（まだ作成していないため）
        if (fetchError.code === '42P01') {
          setConnectionStatus('✅ Supabase接続成功（テーブル未作成）')
        } else {
          setError(fetchError.message)
          setConnectionStatus('❌ 接続エラー')
        }
      } else {
        setConnectionStatus('✅ Supabase接続成功')
      }
    }

    testConnection()
  }, [])

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Supabase接続テスト</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-lg mb-2">{connectionStatus}</p>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-semibold">エラー詳細:</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {!error && connectionStatus.includes('成功') && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">
                環境変数が正しく設定されています。
              </p>
              <p className="text-green-600 text-sm mt-2">
                次のステップ: データベーステーブルを作成してください
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← ホームに戻る
          </a>
        </div>
      </div>
    </main>
  )
}
