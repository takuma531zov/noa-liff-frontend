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
  // 編集フォーム状態（担当者は staff_id、指名無しは空文字）
  const [formData, setFormData] = useState<
    UpdateReservationInput & { staff_id?: string }
  >({
    store: reservation.store,
    staff_id: reservation.staff_id ?? '__none__',
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

  // 画面幅に応じてモバイル判定（< 640px をモバイルとする）
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])


  // フォーム入力ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    if (name === 'staff_id') {
      setFormData((prev) => ({ ...prev, staff_id: value }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // 更新ペイロード（空文字の staff_id は送信しない）
    const payload: UpdateReservationInput = {
      store: formData.store,
      menu: formData.menu,
      reservation_date: formData.reservation_date,
      reservation_time: formData.reservation_time,
      customer_name: formData.customer_name || undefined,
      ...(formData.staff_id && formData.staff_id !== '__none__'
        ? { staff_id: formData.staff_id }
        : {}),
    }

    const response = await fetch(`/api/reservations/${reservation.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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

  return (
    <div
      className={`fixed inset-0 z-[9999] ${isMobile ? 'p-0' : 'p-4'}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        ...(isMobile
          ? {}
          : {
              alignItems: 'center',
              justifyContent: 'center',
            }),
        backgroundColor: 'rgba(17, 24, 39, 0.6)', // グレーアウト（gray-900相当の半透明）
      }}
    >
      <div
        className={
          isMobile
            ? 'bg-white shadow-lg w-full h-full max-w-none rounded-none flex flex-col min-h-0'
            : 'bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col min-h-0'
        }
        style={!isMobile ? { minHeight: '60vh' } : undefined}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold">予約内容変更</h2>
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
          className="flex flex-col"
          style={{ height: '100%' }}
        >
          <div
            className="p-4 sm:p-6 space-y-6"
            style={{
              flex: '1 1 auto',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              minHeight: 0,
            }}
          >
            {/* 店舗選択 */}
            <div>
              <label
                htmlFor="store"
                className="block text-base font-semibold mb-2"
              >
                店舗 <span className="text-red-500">*</span>
              </label>
              <select
                id="store"
                name="store"
                value={formData.store}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-target"
              >
                <option value="">選択してください</option>
                <option value="大宮店">大宮店</option>
                <option value="北浦和店">北浦和店</option>
              </select>
            </div>

            {/* 担当スタッフ */}
            <div>
              <label
                htmlFor="staff_id"
                className="block text-base font-semibold mb-2"
              >
                担当スタッフ <span className="text-red-500">*</span>
              </label>
              <select
                id="staff_id"
                name="staff_id"
                value={formData.staff_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-target"
              >
                <option value="" disabled>
                  選択してください
                </option>
                {staffList
                  .filter((staff) =>
                    formData.store
                      ? staff.stores.includes(formData.store)
                      : true,
                  )
                  .map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                {formData.store && <option value="__none__">指名無し</option>}
              </select>
              {formData.store === '' && (
                <p className="text-xs text-gray-500 mt-1">
                  ※先に店舗を選択してください
                </p>
              )}
            </div>

            {/* メニュー */}
            <div>
              <label
                htmlFor="menu"
                className="block text-base font-semibold mb-2"
              >
                メニュー <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="menu"
                name="menu"
                value={formData.menu}
                onChange={handleChange}
                onBlur={(e) => e.target.blur()}
                required
                placeholder="例: カット・カラー"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-target"
              />
            </div>

            {/* 予約日 */}
            <div>
              <label
                htmlFor="reservation_date"
                className="block text-base font-semibold mb-2"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer touch-target"
              />
            </div>

            {/* 予約時間 */}
            <div>
              <label
                htmlFor="reservation_time"
                className="block text-base font-semibold mb-2"
              >
                予約時間 <span className="text-red-500">*</span>
              </label>
              <select
                id="reservation_time"
                name="reservation_time"
                value={formData.reservation_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-target"
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
                className="block text-base font-semibold mb-2"
              >
                顧客名 <span className="text-gray-400 text-xs">(任意)</span>
              </label>
              <input
                type="text"
                id="customer_name"
                name="customer_name"
                value={formData.customer_name || ''}
                onChange={handleChange}
                onBlur={(e) => e.target.blur()}
                placeholder="例: 田中 花子"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-target"
              />
            </div>
          </div>
          {/* ボタン（下部固定） */}
          <div
            className="px-4 sm:px-6 pt-4 sm:pt-6 border-t border-gray-200 bg-white"
            style={{
              flexShrink: 0,
              paddingBottom: isMobile
                ? 'calc(1.5rem + env(safe-area-inset-bottom, 0px))'
                : '1.5rem',
            }}
          >
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-semibold py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors touch-target text-base"
            >
              {isSubmitting ? '更新中...' : '更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
