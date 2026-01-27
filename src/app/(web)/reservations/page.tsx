'use client'

import { ReservationCard } from '@/components/ReservationCard'
import { ReservationEditModal } from '@/components/ReservationEditModal'
import type { Reservation } from '@/lib/supabase/types'
import { useEffect, useState } from 'react'

// 予約一覧ページ
export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  type MinStaff = { id: string; name: string; stores: string[] }
  const [staffList, setStaffList] = useState<MinStaff[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterStore, setFilterStore] = useState('') // 店舗フィルター（任意）
  // フィルタ: 担当スタッフは staff_id、指名無しは空文字
  const [filterStaff, setFilterStaff] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null)

  // スタッフ一覧を取得
  useEffect(() => {
    const fetchStaff = async () => {
      const res = await fetch(`/api/public/staff?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (!res.ok) return
      const json = (await res.json()) as { staff: MinStaff[] }
      setStaffList(json.staff)
    }

    fetchStaff()
  }, [])

  // 予約一覧を取得（担当スタッフと日付の両方が選択されている時のみ）
  useEffect(() => {
    // 両方選択されていない場合は何もしない
    if (!filterStaff || !filterDate) {
      setReservations([])
      setIsLoading(false)
      return
    }

    const fetchReservations = async () => {
      setIsLoading(true)
      const params = new URLSearchParams({
        date: filterDate,
        staff_id: filterStaff,
      })
      const res = await fetch(`/api/admin/reservations?${params.toString()}`)
      if (!res.ok) {
        setIsLoading(false)
        return
      }
      const json = (await res.json()) as { reservations: Reservation[] }
      setReservations(json.reservations)
      setIsLoading(false)
    }

    fetchReservations()
  }, [filterStaff, filterDate])

  // 予約一覧を再取得
  const refetchReservations = async () => {
    if (!filterStaff || !filterDate) return

    setIsLoading(true)
    const params = new URLSearchParams({
      date: filterDate,
      staff_id: filterStaff,
    })
    const res = await fetch(`/api/admin/reservations?${params.toString()}`)
    if (!res.ok) {
      setIsLoading(false)
      return
    }
    const json = (await res.json()) as { reservations: Reservation[] }
    setReservations(json.reservations)
    setIsLoading(false)
  }

  // 編集ハンドラ
  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation)
  }

  // 編集成功ハンドラ
  const handleEditSuccess = () => {
    setEditingReservation(null)
    refetchReservations()
  }

  // キャンセルハンドラ
  const handleCancel = async (reservation: Reservation) => {
    if (!confirm('この予約をキャンセルしてもよろしいですか？')) {
      return
    }

    const response = await fetch(`/api/reservations/${reservation.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      alert(errorData.error || '予約のキャンセルに失敗しました')
      return
    }

    alert('予約をキャンセルしました')
    refetchReservations()
  }

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">予約一覧</h1>

        {/* フィルターエリア */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 店舗選択（任意） */}
            <div className="flex-1">
              <div className="block text-base font-semibold mb-2">店舗</div>
              <select
                value={filterStore}
                onChange={(e) => {
                  setFilterStore(e.target.value)
                  // 店舗変更時は担当者選択をクリア
                  setFilterStaff('')
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-target"
              >
                <option value="">選択してください（任意）</option>
                <option value="大宮店">大宮店</option>
                <option value="北浦和店">北浦和店</option>
              </select>
            </div>

            {/* 担当スタッフ選択 */}
            <div className="flex-1">
              <div className="block text-base font-semibold mb-2">担当者</div>
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-target"
              >
                <option value="" disabled>
                  担当スタッフを選択
                </option>
                {staffList
                  .filter((staff) =>
                    filterStore ? staff.stores.includes(filterStore) : true,
                  )
                  .map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                <option value="__none__">指名無し</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                ※先に店舗を選択すると絞り込めます
              </p>
            </div>

            {/* 予約日選択 */}
            <div className="flex-1">
              <div className="block text-base font-semibold mb-2">予約日</div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker()}
                onBlur={(e) => e.target.blur()}
                lang="en"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer touch-target"
              />
            </div>
          </div>
        </div>

        {/* 予約一覧 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-center">
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : !filterStaff || !filterDate ? (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-center">
              <p className="text-gray-600">
                担当スタッフと予約日を選択してください
              </p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-center">
              <p className="text-gray-600">予約がありません</p>
            </div>
          ) : (
            reservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onEdit={handleEdit}
                onCancel={handleCancel}
              />
            ))
          )}
        </div>
      </div>

      {/* 編集モーダル */}
      {editingReservation && (
        <ReservationEditModal
          reservation={editingReservation}
          onClose={() => setEditingReservation(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  )
}
