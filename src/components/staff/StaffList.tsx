'use client'

import type { Staff } from '@/lib/supabase/types'
import { useState } from 'react'

type Props = {
  staffList: Staff[]
  onChanged: () => void
}

// スタッフ一覧 + 編集（名前・店舗・公式LINE）/ 削除
export const StaffList = ({ staffList, onChanged }: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editStores, setEditStores] = useState<string[]>([])
  const [editOfficialUrl, setEditOfficialUrl] = useState('')

  const beginEdit = (s: Staff) => {
    setEditingId(s.id)
    setEditName(s.name)
    setEditStores(s.stores)
    setEditOfficialUrl(s.official_line_url || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditStores([])
    setEditOfficialUrl('')
  }

  const toggleStore = (store: string, checked: boolean) =>
    setEditStores((prev) =>
      checked ? [...prev, store] : prev.filter((s) => s !== store),
    )

  const handleUpdate = async (id: string) => {
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        stores: editStores,
        official_line_url: editOfficialUrl || null,
      }),
    })
    if (!res.ok) {
      alert('更新に失敗しました')
      return
    }
    cancelEdit()
    onChanged()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name}さんを削除しますか？`)) return
    const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      alert('スタッフの削除に失敗しました')
      return
    }
    onChanged()
  }

  return (
    <div className="space-y-2">
      {staffList.map((staff) => (
        <div key={staff.id} className="p-3 border border-gray-200 rounded-lg">
          {/* 上段: 名前 + 店舗バッジ（モバイルで縦積み） */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-medium text-sm flex-shrink-0">
                {staff.name}
              </span>
              <div className="flex flex-wrap gap-1">
                {staff.stores.length > 1 ? (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 whitespace-nowrap">
                    兼任
                  </span>
                ) : (
                  staff.stores.map((store) => (
                    <span
                      key={store}
                      className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 whitespace-nowrap"
                    >
                      {store}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* アクション */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => beginEdit(staff)}
                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                編集
              </button>
              <button
                type="button"
                onClick={() => handleDelete(staff.id, staff.name)}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                削除
              </button>
            </div>
          </div>

          {/* 下段: 公式LINEリンク（店舗バッジの下に常に表示） */}
          <div className="mt-2">
            {staff.official_line_url ? (
              <a
                href={staff.official_line_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 underline break-all"
              >
                {staff.official_line_url}
              </a>
            ) : (
              <span className="text-xs text-gray-400">公式LINE未設定</span>
            )}
          </div>

          {/* 編集フォーム（インライン） */}
          {editingId === staff.id && (
            <div className="mt-3 border-t pt-3 space-y-3">
              {/* 名前 */}
              <div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="スタッフ名"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              {/* 公式LINEリンク */}
              <div>
                <input
                  type="url"
                  value={editOfficialUrl}
                  onChange={(e) => setEditOfficialUrl(e.target.value)}
                  placeholder="公式LINEリンク（任意）"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              {/* 店舗選択 */}
              <div>
                <div className="block text-sm font-semibold mb-2">
                  担当店舗（複数選択可）
                </div>
                <div className="flex gap-4 flex-wrap">
                  {['大宮店', '北浦和店'].map((store) => (
                    <label
                      key={store}
                      className="flex items-center gap-3 p-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={editStores.includes(store)}
                        onChange={(e) => toggleStore(store, e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span>{store}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ボタン */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => handleUpdate(staff.id)}
                  className="px-3 py-2 text-xs bg-blue-600 text-white rounded"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-2 text-xs border rounded"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
