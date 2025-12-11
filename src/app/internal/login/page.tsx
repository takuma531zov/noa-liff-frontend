'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// 管理ログインページ
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">管理ログイン</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor="internal-user"
              className="block text-sm font-medium mb-1"
            >
              ユーザー
            </label>
            <input
              id="internal-user"
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              onBlur={(e) => e.target.blur()}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label
              htmlFor="internal-password"
              className="block text-sm font-medium mb-1"
            >
              パスワード
            </label>
            <input
              id="internal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={(e) => e.target.blur()}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400"
          >
            {isLoading ? '処理中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}
