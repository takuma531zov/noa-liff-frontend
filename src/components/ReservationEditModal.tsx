'use client'

import { createClient } from '@/lib/supabase/client'
import type {
  Reservation,
  Staff,
  UpdateReservationInput,
} from '@/lib/supabase/types'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

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
  // モーダルのマウント状態（Portal用）
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
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
    const originalOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Escキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

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

  // SSR回避：クライアントマウント後のみ描画（Portal安全化）
  if (!mounted) return null

  return createPortal(
    // オーバーレイ（iOS Safariで最前面固定・全画面）
    <div
      role="presentation"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(17, 24, 39, 0.6)',
        display: isMobile ? 'block' : 'flex',
        alignItems: isMobile ? undefined : 'center',
        justifyContent: isMobile ? undefined : 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      // アクセシビリティ: キーボード操作でのクローズ（Enter/Space または Esc）
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) onClose()
      }}
      tabIndex={-1}
    >
      {/* モーダル本体（モバイルは全画面、デスクトップは中央寄せ） */}
      <div
        className={
          isMobile
            ? 'bg-white shadow-lg w-full max-w-none rounded-none flex flex-col'
            : 'bg-white rounded-lg shadow-lg max-w-2xl w-full flex flex-col'
        }
        style={
          isMobile
            ? { height: '100dvh', overflow: 'hidden' }
            : { maxHeight: '90vh', minHeight: '60vh' }
        }
      >
        {/* 入力フォーム（コンテンツ全体を1スクロール領域に） */}
        <form
          id="reservation-edit-form"
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col"
          style={{ minHeight: 0 }}
        >
          {/* スクロール領域（ヘッダー＋入力フィールド） */}
          <div
            className="flex-1 p-4 sm:p-6 space-y-6"
            style={{
              minHeight: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              touchAction: 'pan-y',
              // ボトム固定ボタンと干渉しないよう余白を広めに確保
              paddingBottom: isMobile
                ? 'calc(120px + env(safe-area-inset-bottom, 0px))'
                : undefined,
            }}
          >
            {/* モーダルヘッダー（スクロール領域内） */}
            <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold">予約内容変更</h2>
            </div>
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
          {/* フッター（デスクトップのみ表示。モバイルは別レイヤーの更新ボタンを使用） */}
          {!isMobile && (
            <div className="px-4 sm:px-6 py-4 flex-shrink-0 border-t border-gray-200" style={{ background: '#ffffff' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-semibold py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors touch-target text-base"
              >
                {isSubmitting ? '更新中...' : '更新する'}
              </button>
            </div>
          )}
        </form>
      </div>
      {/* 最前レイヤーの操作ボタン（モバイル時） */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          {/* 閉じる（右上固定） */}
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '40px',
              height: '40px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.95)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              color: '#4b5563',
              pointerEvents: 'auto',
            }}
          >
            ×
          </button>
          {/* 更新（下部中央固定） */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: '12px 16px',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <button
              type="submit"
              form="reservation-edit-form"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-semibold py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors touch-target text-base"
              style={{ pointerEvents: 'auto' }}
            >
              {isSubmitting ? '更新中...' : '更新する'}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
