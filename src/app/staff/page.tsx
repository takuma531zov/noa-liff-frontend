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
  })
  const [isAdding, setIsAdding] = useState(false)

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
        is_active: true,
      },
    ])

    if (error) {
      console.error('スタッフ追加エラー:', error)
      alert('スタッフの追加に失敗しました')
    } else {
      setNewStaff({ name: '', stores: [] })
      fetchStaff()
    }

    setIsAdding(false)
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
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newStaff.name}
              onChange={(e) =>
                setNewStaff((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="スタッフ名"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isAdding || newStaff.stores.length === 0}
              className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isAdding ? '追加中...' : '追加'}
            </button>
          </div>
          <div>
            <div className="block text-sm font-semibold mb-2">
              担当店舗（複数選択可）
            </div>
            <div className="flex gap-4">
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
        </form>
      </div>

      {/* スタッフ一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">スタッフ一覧</h2>
          <div className="space-y-2">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="flex items-center justify-between gap-2 p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium text-sm flex-shrink-0">
                    {staff.name}
                  </span>
                  <div className="flex gap-1">
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
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(staff.id, staff.name)}
                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
