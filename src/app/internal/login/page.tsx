'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// 管理ログインページ
// スタッフログインページ
export default function InternalLoginPage() {
  const router = useRouter()
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const res = await fetch('/api/internal/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, password }),
    })

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setError(data.error || 'ログインに失敗しました')
      setIsLoading(false)
      return
    }

    router.replace('/reservations')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">
          スタッフログイン
        </h1>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label
                htmlFor="internal-user"
                className="block text-base font-semibold mb-2"
              >
                ユーザー
              </label>
              <input
                id="internal-user"
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                onBlur={(e) => e.target.blur()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-target"
                required
              />
            </div>
            <div>
              <label
                htmlFor="internal-password"
                className="block text-base font-semibold mb-2"
              >
                パスワード
              </label>
              <input
                id="internal-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={(e) => e.target.blur()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-target"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-semibold py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors touch-target text-base"
            >
              {isLoading ? '処理中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
