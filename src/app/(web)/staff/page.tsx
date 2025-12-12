'use client'

import type { Staff } from '@/lib/supabase/types'
import { useCallback, useEffect, useState } from 'react'

// スタッフ管理ページ
export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newStaff, setNewStaff] = useState({
    name: '',
    stores: [] as string[],
    officialLineUrl: '',
  })
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingOfficialUrl, setEditingOfficialUrl] = useState('')
  const [editingName, setEditingName] = useState('')
  const [editingStores, setEditingStores] = useState<string[]>([])

  // スタッフ一覧を取得
  const fetchStaff = useCallback(async () => {
    const res = await fetch('/api/admin/staff')
    if (!res.ok) return
    const json = (await res.json()) as { staff: Staff[] }
    setStaffList(json.staff)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  // スタッフ追加
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)

    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newStaff.name,
        stores: newStaff.stores,
        official_line_url: newStaff.officialLineUrl || null,
      }),
    })

    if (!res.ok) {
      alert('スタッフの追加に失敗しました')
    } else {
      setNewStaff({ name: '', stores: [], officialLineUrl: '' })
      fetchStaff()
    }

    setIsAdding(false)
  }

  // スタッフ更新（名前・店舗・公式LINE）
  const handleUpdateStaff = async (id: string) => {
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingName,
        stores: editingStores,
        official_line_url: editingOfficialUrl || null,
      }),
    })

    if (!res.ok) {
      alert('更新に失敗しました')
      return
    }
    setEditingId(null)
    setEditingOfficialUrl('')
    setEditingName('')
    setEditingStores([])
    fetchStaff()
  }

  // スタッフ削除（論理削除）
  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`${name}さんを削除しますか？`)) return

    const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      alert('スタッフの削除に失敗しました')
    } else {
      fetchStaff()
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p className="text-center text-gray-600">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">スタッフ管理</h1>

      {/* スタッフ追加フォーム */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">スタッフ追加</h2>
        <form onSubmit={handleAddStaff} className="space-y-6">
          {/* スタッフ名 */}
          <div>
            <input
              type="text"
              value={newStaff.name}
              onChange={(e) =>
                setNewStaff((prev) => ({ ...prev, name: e.target.value }))
              }
              onBlur={(e) => e.target.blur()}
              placeholder="スタッフ名"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-target"
            />
          </div>
          {/* 店舗（複数選択） */}
          <div>
            <div className="block text-base font-semibold mb-2">
              担当店舗（複数選択可）
            </div>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-3 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newStaff.stores.includes('大宮店')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setNewStaff((prev) => ({
                        ...prev,
                        stores: [...prev.stores, '大宮店'],
                      }))
                    } else {
                      setNewStaff((prev) => ({
                        ...prev,
                        stores: prev.stores.filter((s) => s !== '大宮店'),
                      }))
                    }
                  }}
                  className="w-6 h-6"
                />
                <span className="text-base">大宮店</span>
              </label>
              <label className="flex items-center gap-3 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newStaff.stores.includes('北浦和店')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setNewStaff((prev) => ({
                        ...prev,
                        stores: [...prev.stores, '北浦和店'],
                      }))
                    } else {
                      setNewStaff((prev) => ({
                        ...prev,
                        stores: prev.stores.filter((s) => s !== '北浦和店'),
                      }))
                    }
                  }}
                  className="w-6 h-6"
                />
                <span className="text-base">北浦和店</span>
              </label>
            </div>
          </div>
          {/* 公式LINEリンク */}
          <div>
            <input
              type="url"
              value={newStaff.officialLineUrl}
              onChange={(e) =>
                setNewStaff((prev) => ({
                  ...prev,
                  officialLineUrl: e.target.value,
                }))
              }
              onBlur={(e) => e.target.blur()}
              placeholder="公式LINEリンク（任意）"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-target"
            />
          </div>
          {/* 追加ボタン */}
          <div className="flex justify-end mt-2 md:mt-4">
            <button
              type="submit"
              disabled={
                isAdding || newStaff.stores.length === 0 || !newStaff.name
              }
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors touch-target text-base"
            >
              {isAdding ? '追加中...' : '追加'}
            </button>
          </div>
        </form>
      </div>

      {/* スタッフ一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            スタッフ一覧
          </h2>
          <div className="space-y-3">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                {/* 上段: モバイル縦積み、SM以上で横並び */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-semibold text-base truncate">
                      {editingId === staff.id ? (
                        <input
                          type="text"
                          defaultValue={staff.name}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={(e) => e.target.blur()}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-target"
                        />
                      ) : (
                        staff.name
                      )}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {editingId === staff.id ? (
                        ['大宮店', '北浦和店'].map((store) => (
                          <label
                            key={store}
                            className="flex items-center gap-1 p-1 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              defaultChecked={staff.stores.includes(store)}
                              onChange={(e) =>
                                setEditingStores((prev) =>
                                  e.target.checked
                                    ? [...new Set([...prev, store])]
                                    : prev.filter((s) => s !== store),
                                )
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{store}</span>
                          </label>
                        ))
                      ) : staff.stores.length > 1 ? (
                        <span className="px-2 py-0.5 rounded-full text-sm bg-green-100 text-green-800 whitespace-nowrap">
                          兼任
                        </span>
                      ) : (
                        staff.stores.map((store) => (
                          <span
                            key={store}
                            className="px-2 py-0.5 rounded-full text-sm bg-green-100 text-green-800 whitespace-nowrap"
                          >
                            {store}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                    {editingId !== staff.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(staff.id)
                            setEditingOfficialUrl(staff.official_line_url || '')
                            setEditingName(staff.name)
                            setEditingStores(staff.stores)
                          }}
                          className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors touch-target"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteStaff(staff.id, staff.name)
                          }
                          className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors touch-target"
                        >
                          削除
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* 下段: 公式LINEリンク（常に店舗の下に表示） */}
                <div className="mt-2">
                  {editingId === staff.id ? (
                    <>
                      <input
                        type="url"
                        placeholder="公式LINEリンク（任意）"
                        defaultValue={staff.official_line_url || ''}
                        onChange={(e) => setEditingOfficialUrl(e.target.value)}
                        onBlur={(e) => e.target.blur()}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-target"
                      />
                      {/* 編集アクション（リンク入力の下に配置） */}
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleUpdateStaff(staff.id)}
                          className="px-6 py-3 text-base bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700 active:scale-[0.99] touch-target"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null)
                            setEditingOfficialUrl('')
                            setEditingName('')
                            setEditingStores([])
                          }}
                          className="px-6 py-3 text-base text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 active:scale-[0.99] touch-target"
                        >
                          キャンセル
                        </button>
                      </div>
                    </>
                  ) : staff.official_line_url ? (
                    <a
                      href={staff.official_line_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 underline break-all"
                    >
                      {staff.official_line_url}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">
                      公式LINE未設定
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
