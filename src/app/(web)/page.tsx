'use client'

import { ReservationForm } from '@/components/ReservationForm'
import { ReservationSuccess } from '@/components/ReservationSuccess'
import type { CreateReservationResponse } from '@/lib/supabase/types'
import { useState } from 'react'

// トップページ（予約登録）
export default function HomePage() {
  const [successData, setSuccessData] =
    useState<CreateReservationResponse | null>(null)

  // 予約成功時のハンドラ
  const handleSuccess = (response: CreateReservationResponse) => {
    setSuccessData(response)
  }

  // 新規予約ボタンのハンドラ
  const handleNewReservation = () => {
    setSuccessData(null)
  }

  // 成功画面を表示
  if (successData) {
    return (
      <ReservationSuccess
        consentUrl={successData.consentUrl}
        onNewReservation={handleNewReservation}
      />
    )
  }

  // 予約登録フォームを表示
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">新規予約登録</h1>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <ReservationForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
