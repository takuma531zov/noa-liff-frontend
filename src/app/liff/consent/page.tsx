'use client'

import type { Reservation } from '@/lib/supabase/types'
import liff from '@line/liff'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

// LIFF同意ページコンポーネント
const ConsentPageContent = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLiffReady, setIsLiffReady] = useState(false)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)

  // LIFF初期化
  useEffect(() => {
    const initLiff = async () => {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID
      if (!liffId) {
        setError('LIFF IDが設定されていません')
        setIsLoading(false)
        return
      }

      await liff.init({ liffId })
      setIsLiffReady(true)

      if (!liff.isLoggedIn()) {
        liff.login()
        return
      }
    }

    initLiff()
  }, [])

  // トークン検証と予約情報取得
  useEffect(() => {
    if (!isLiffReady || !token) return

    const verifyToken = async () => {
      setIsLoading(true)
      const response = await fetch('/api/consent/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || '予約情報の取得に失敗しました')
        setIsLoading(false)
        return
      }

      const data = await response.json()
      setReservation(data.reservation)
      setIsLoading(false)
    }

    verifyToken()
  }, [isLiffReady, token])

  // 同意処理
  const handleConsent = async () => {
    if (!isAgreed) {
      alert('同意事項を確認してチェックを入れてください')
      return
    }

    if (!reservation || !token) return

    setIsProcessing(true)

    // LINEユーザー情報を取得
    const profile = await liff.getProfile()
    const lineUserId = profile.userId
    const lineDisplayName = profile.displayName

    const response = await fetch('/api/consent/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        lineUserId,
        lineDisplayName,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      alert(errorData.error || '同意処理に失敗しました')
      setIsProcessing(false)
      return
    }

    alert('予約の同意が完了しました。リマインダーを送信いたします。')
    liff.closeWindow()
  }

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-red-600">無効なリンクです</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">予約情報が見つかりません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            予約確認
          </h1>

          {/* 予約情報 */}
          <div className="space-y-4 border-t border-b border-gray-200 py-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600">店舗</div>
              <div className="text-lg font-medium text-gray-800">
                {reservation.store}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600">予約日時</div>
              <div className="text-lg font-medium text-gray-800">
                {formatDate(reservation.reservation_date)}{' '}
                {reservation.reservation_time.slice(0, 5)}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600">担当スタッフ</div>
              <div className="text-lg font-medium text-gray-800">
                {reservation.staff_name}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600">メニュー</div>
              <div className="text-lg font-medium text-gray-800">
                {reservation.menu}
              </div>
            </div>
          </div>

          {/* 同意事項 */}
          <div className="space-y-3">
            <div className="text-sm text-gray-700 leading-relaxed">
              予約日の1週間前と前日にLINEでリマインダーを送信いたします。
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                上記の予約内容とリマインダー送信に同意します
              </span>
            </label>
          </div>

          {/* 同意ボタン */}
          <button
            type="button"
            onClick={handleConsent}
            disabled={!isAgreed || isProcessing}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? '処理中...' : '同意する'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Suspenseでラップしたページコンポーネント
export default function ConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <ConsentPageContent />
    </Suspense>
  )
}
