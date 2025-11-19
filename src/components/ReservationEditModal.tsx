'use client'

import { createClient } from '@/lib/supabase/client'
import type {
  Reservation,
  Staff,
  UpdateReservationInput,
} from '@/lib/supabase/types'
import { useEffect, useState } from 'react'

// 30分刻みの時間オプションを生成（9:00~20:00）
const generateTimeOptions = () => {
  const options = []
  for (let hour = 9; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 20 && minute === 30) continue
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      options.push(timeString)
    }
  }
  return options
}

// 予約編集モーダルコンポーネント
type ReservationEditModalProps = {
  reservation: Reservation
  onClose: () => void
  onSuccess: () => void
}

export const ReservationEditModal = ({
  reservation,
  onClose,
  onSuccess,
}: ReservationEditModalProps) => {
  const [formData, setFormData] = useState<UpdateReservationInput>({
    store: reservation.store,
    staff_name: reservation.staff_name,
    menu: reservation.menu,
    reservation_date: reservation.reservation_date,
    reservation_time: reservation.reservation_time.slice(0, 5),
    customer_name: reservation.customer_name || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [staffList, setStaffList] = useState<Staff[]>([])
  const timeOptions = generateTimeOptions()

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

  // モーダル表示時にbodyのスクロールを無効化
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  // フォーム入力ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const response = await fetch(`/api/reservations/${reservation.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      alert(errorData.error || '予約の更新に失敗しました')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    alert('予約を更新しました')
    onSuccess()
  }

  // 背景クリックハンドラ
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Background click to close modal
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900 bg-opacity-50 p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={handleBackgroundClick}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold">予約内容変更</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* モーダルボディ */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto flex-1"
        >
          {/* 店舗選択 */}
          <div>
            <label htmlFor="store" className="block text-sm font-semibold mb-2">
              店舗 <span className="text-red-500">*</span>
            </label>
            <select
              id="store"
              name="store"
              value={formData.store}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">選択してください</option>
              <option value="大宮店">大宮店</option>
              <option value="北浦和店">北浦和店</option>
            </select>
          </div>

          {/* 担当スタッフ名 */}
          <div>
            <label
              htmlFor="staff_name"
              className="block text-sm font-semibold mb-2"
            >
              担当スタッフ <span className="text-red-500">*</span>
            </label>
            <select
              id="staff_name"
              name="staff_name"
              value={formData.staff_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">選択してください</option>
              {staffList
                .filter((staff) =>
                  formData.store ? staff.stores.includes(formData.store) : true,
                )
                .map((staff) => (
                  <option key={staff.id} value={staff.name}>
                    {staff.name}
                  </option>
                ))}
              {formData.store && <option value="指名無し">指名無し</option>}
            </select>
            {formData.store === '' && (
              <p className="text-xs text-gray-500 mt-1">
                ※先に店舗を選択してください
              </p>
            )}
          </div>

          {/* メニュー */}
          <div>
            <label htmlFor="menu" className="block text-sm font-semibold mb-2">
              メニュー <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="menu"
              name="menu"
              value={formData.menu}
              onChange={handleChange}
              required
              placeholder="例: カット・カラー"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 予約日 */}
          <div>
            <label
              htmlFor="reservation_date"
              className="block text-sm font-semibold mb-2"
            >
              予約日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="reservation_date"
              name="reservation_date"
              value={formData.reservation_date}
              onChange={handleChange}
              onClick={(e) => e.currentTarget.showPicker()}
              required
              lang="en"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            />
          </div>

          {/* 予約時間 */}
          <div>
            <label
              htmlFor="reservation_time"
              className="block text-sm font-semibold mb-2"
            >
              予約時間 <span className="text-red-500">*</span>
            </label>
            <select
              id="reservation_time"
              name="reservation_time"
              value={formData.reservation_time}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">選択してください</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          {/* 顧客名（任意） */}
          <div>
            <label
              htmlFor="customer_name"
              className="block text-sm font-semibold mb-2"
            >
              顧客名 <span className="text-gray-400 text-xs">(任意)</span>
            </label>
            <input
              type="text"
              id="customer_name"
              name="customer_name"
              value={formData.customer_name || ''}
              onChange={handleChange}
              placeholder="例: 田中 花子"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              戻る
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '更新中...' : '更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
