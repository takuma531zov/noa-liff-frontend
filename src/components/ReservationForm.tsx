'use client'

import { createClient } from '@/lib/supabase/client'
import type { CreateReservationResponse, Staff } from '@/lib/supabase/types'
import { useEffect, useState } from 'react'

// 30分刻みの時間オプションを生成（9:00~20:00）
const generateTimeOptions = () => {
  const options = []
  for (let hour = 9; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      // 20:30は除外
      if (hour === 20 && minute === 30) continue
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      options.push(timeString)
    }
  }
  return options
}

// 予約登録フォームコンポーネント
type ReservationFormProps = {
  onSuccess: (response: CreateReservationResponse) => void
}

export const ReservationForm = ({ onSuccess }: ReservationFormProps) => {
  // 予約登録フォーム状態（担当者は staff_id を保持、指名無しは空文字）
  const [formData, setFormData] = useState({
    store: '',
    staff_id: '',
    menu: '',
    reservation_date: '',
    reservation_time: '',
    customer_name: '',
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
        console.log('取得したスタッフ:', data)
        setStaffList(data)
      }
    }

    fetchStaff()
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

    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // staff_id は空文字の場合は送らない（サーバ側で指名無し処理）
      body: JSON.stringify({
        ...formData,
        staff_id:
          formData.staff_id && formData.staff_id !== '__none__'
            ? formData.staff_id
            : undefined,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      alert(errorData.error || '予約の登録に失敗しました')
      setIsSubmitting(false)
      return
    }

    const result = (await response.json()) as CreateReservationResponse
    setIsSubmitting(false)

    // フォームをリセット
    setFormData({
      store: '',
      staff_id: '',
      menu: '',
      reservation_date: '',
      reservation_time: '',
      customer_name: '',
    })

    // 成功コールバックを呼び出し
    onSuccess(result)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 店舗選択 */}
      <div>
        <label htmlFor="store" className="block text-base font-semibold mb-2">
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
              formData.store ? staff.stores.includes(formData.store) : true,
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
        <label htmlFor="menu" className="block text-base font-semibold mb-2">
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
        <p className="text-xs text-gray-500 mt-1">
          ※LINE表示名は同意時に自動取得されます
        </p>
      </div>

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white font-semibold py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors touch-target text-base"
      >
        {isSubmitting ? '登録中...' : '予約を登録'}
      </button>
    </form>
  )
}
