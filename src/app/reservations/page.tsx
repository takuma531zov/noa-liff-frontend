'use client'

import { ReservationCard } from '@/components/ReservationCard'
import { ReservationEditModal } from '@/components/ReservationEditModal'
import { createClient } from '@/lib/supabase/client'
import type { Reservation, Staff } from '@/lib/supabase/types'
import { useEffect, useState } from 'react'

// 予約一覧ページ
export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
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
      const supabase = createClient()
      const base = supabase
        .from('reservations')
        .select('*')
        .eq('reservation_date', filterDate)
        .order('reservation_time', { ascending: true })

      const { data, error } = await (filterStaff
        ? base.eq('staff_id', filterStaff)
        : base.is('staff_id', null))

      if (error) {
        console.error('予約取得エラー:', error)
        setIsLoading(false)
        return
      }

      if (data) {
        setReservations(data)
      }
      setIsLoading(false)
    }

    fetchReservations()
  }, [filterStaff, filterDate])

  // 予約一覧を再取得
  const refetchReservations = async () => {
    if (!filterStaff || !filterDate) return

    setIsLoading(true)
    const supabase = createClient()
    const base = supabase
      .from('reservations')
      .select('*')
      .eq('reservation_date', filterDate)
      .order('reservation_time', { ascending: true })

    const { data, error } = await (filterStaff
      ? base.eq('staff_id', filterStaff)
      : base.is('staff_id', null))

    if (error) {
      console.error('予約取得エラー:', error)
      setIsLoading(false)
      return
    }

    if (data) {
      setReservations(data)
    }
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
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">予約一覧</h1>

        {/* フィルターエリア */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 店舗選択（任意） */}
            <div className="flex-1">
              <div className="block text-sm font-semibold mb-2">店舗</div>
              <select
                value={filterStore}
                onChange={(e) => {
                  setFilterStore(e.target.value)
                  // 店舗変更時は担当者選択をクリア
                  setFilterStaff('')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">選択してください（任意）</option>
                <option value="大宮店">大宮店</option>
                <option value="北浦和店">北浦和店</option>
              </select>
            </div>

            {/* 担当スタッフ選択 */}
            <div className="flex-1">
              <div className="block text-sm font-semibold mb-2">担当者</div>
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" disabled>
                  担当スタッフを選択
                </option>
                {staffList
                  .filter((staff) =>
                    filterStore ? staff.stores.includes(filterStore) : true,
                  )
                  .map((staff) => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                <option value="">指名無し</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                ※先に店舗を選択すると絞り込めます
              </p>
            </div>

            {/* 予約日選択 */}
            <div className="flex-1">
              <div className="block text-sm font-semibold mb-2">予約日</div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker()}
                lang="en"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 予約一覧 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : !filterStaff || !filterDate ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600">
                担当スタッフと予約日を選択してください
              </p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
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
