'use client'

import { createClient } from '@/lib/supabase/client'
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
    const supabase = createClient()
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('スタッフ取得エラー:', error)
      return
    }

    if (data) {
      setStaffList(data)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  // スタッフ追加
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)

    const supabase = createClient()
    const { error } = await supabase.from('staff').insert([
      {
        name: newStaff.name,
        stores: newStaff.stores,
        official_line_url: newStaff.officialLineUrl || null,
        is_active: true,
      },
    ])

    if (error) {
      console.error('スタッフ追加エラー:', error)
      alert('スタッフの追加に失敗しました')
    } else {
      setNewStaff({ name: '', stores: [], officialLineUrl: '' })
      fetchStaff()
    }

    setIsAdding(false)
  }

  // スタッフ更新（名前・店舗・公式LINE）
  const handleUpdateStaff = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('staff')
      .update({
        name: editingName,
        stores: editingStores,
        official_line_url: editingOfficialUrl || null,
      })
      .eq('id', id)

    if (error) {
      console.error('スタッフ更新エラー:', error)
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

    const supabase = createClient()
    const { error } = await supabase
      .from('staff')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('スタッフ削除エラー:', error)
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
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">スタッフ管理</h1>

      {/* スタッフ追加フォーム */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">スタッフ追加</h2>
        <form onSubmit={handleAddStaff} className="space-y-6">
          {/* スタッフ名 */}
          <div>
            <input
              type="text"
              value={newStaff.name}
              onChange={(e) =>
                setNewStaff((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="スタッフ名"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {/* 店舗（複数選択） */}
          <div>
            <div className="block text-sm font-semibold mb-2">担当店舗（複数選択可）</div>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-3 p-2 cursor-pointer">
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
                  className="w-5 h-5"
                />
                <span>大宮店</span>
              </label>
              <label className="flex items-center gap-3 p-2 cursor-pointer">
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
                  className="w-5 h-5"
                />
                <span>北浦和店</span>
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
              placeholder="公式LINEリンク（任意）"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {/* 追加ボタン */}
          <div className="flex justify-end mt-2 md:mt-4">
            <button
              type="submit"
              disabled={isAdding || newStaff.stores.length === 0 || !newStaff.name}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isAdding ? '追加中...' : '追加'}
            </button>
          </div>
        </form>
      </div>

      {/* スタッフ一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">スタッフ一覧</h2>
          <div className="space-y-3">
            {staffList.map((staff) => (
              <div key={staff.id} className="p-3 border border-gray-200 rounded-lg">
                {/* 上段: モバイル縦積み、SM以上で横並び */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-medium text-sm truncate">
                      {editingId === staff.id ? (
                        <input
                          type="text"
                          defaultValue={staff.name}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-60 text-sm"
                        />
                      ) : (
                        staff.name
                      )}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {editingId === staff.id ? (
                        ['大宮店', '北浦和店'].map((store) => (
                          <label key={store} className="flex items-center gap-1 p-1 cursor-pointer">
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
                            <span className="text-xs">{store}</span>
                          </label>
                        ))
                      ) : staff.stores.length > 1 ? (
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
                          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff.id, staff.name)}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      {/* 編集アクション（リンク入力の下に配置） */}
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleUpdateStaff(staff.id)}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700 active:scale-[0.99]"
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
                          className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 active:scale-[0.99]"
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
                      className="text-xs text-blue-600 underline break-all"
                    >
                      {staff.official_line_url}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">公式LINE未設定</span>
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
