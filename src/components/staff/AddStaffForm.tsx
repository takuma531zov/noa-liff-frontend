'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

type Props = {
  onAdded: () => void
}

// スタッフ追加フォーム（公式LINEリンク含む）
export const AddStaffForm = ({ onAdded }: Props) => {
  const [name, setName] = useState('')
  const [stores, setStores] = useState<string[]>([])
  const [officialLineUrl, setOfficialLineUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const toggleStore = (store: string, checked: boolean) =>
    setStores((prev) => (checked ? [...prev, store] : prev.filter((s) => s !== store)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)

    const supabase = createClient()
    const { error } = await supabase.from('staff').insert([
      {
        name,
        stores,
        official_line_url: officialLineUrl || null,
        is_active: true,
      },
    ])

    if (!error) {
      setName('')
      setStores([])
      setOfficialLineUrl('')
      onAdded()
    } else {
      alert('スタッフの追加に失敗しました')
      console.error('スタッフ追加エラー:', error)
    }

    setIsAdding(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 名前入力 */}
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="スタッフ名"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 公式LINEリンク（任意） */}
      <div>
        <input
          type="url"
          value={officialLineUrl}
          onChange={(e) => setOfficialLineUrl(e.target.value)}
          placeholder="公式LINEリンク（任意）"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 担当店舗 */}
      <div>
        <div className="block text-sm font-semibold mb-2">担当店舗（複数選択可）</div>
        <div className="flex gap-4 flex-wrap">
          {['大宮店', '北浦和店'].map((store) => (
            <label key={store} className="flex items-center gap-3 p-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stores.includes(store)}
                onChange={(e) => toggleStore(store, e.target.checked)}
                className="w-5 h-5"
              />
              <span>{store}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 追加ボタン */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isAdding || stores.length === 0 || !name}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isAdding ? '追加中...' : '追加'}
        </button>
      </div>
    </form>
  )
}

