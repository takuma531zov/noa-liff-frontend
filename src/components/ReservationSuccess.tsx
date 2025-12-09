'use client'

import { useState } from 'react'

// 予約登録成功画面コンポーネント
type ReservationSuccessProps = {
  consentUrl: string
  onNewReservation: () => void
}

export const ReservationSuccess = ({
  consentUrl,
  onNewReservation,
}: ReservationSuccessProps) => {
  const [copied, setCopied] = useState(false)

  // コピーボタンハンドラ
  const handleCopy = async () => {
    await navigator.clipboard.writeText(consentUrl)
    setCopied(true)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white p-6 rounded-lg shadow">
        {/* 成功メッセージ */}
        <div className="mb-6 text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            予約登録が完了しました
          </h2>
          <p className="text-gray-600">
            以下のリンクをLINEでお客様に送信してください
          </p>
        </div>

        {/* 同意リンク表示 */}
        <div className="mb-6">
          <div className="block text-sm font-semibold mb-2">同意リンク</div>
          <div className="flex gap-2 items-stretch">
            <input
              type="text"
              value={consentUrl}
              readOnly
              className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs sm:text-sm truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="flex-shrink-0 px-3 sm:px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm"
            >
              {copied ? 'コピー済み' : 'コピー'}
            </button>
          </div>
        </div>

        {/* 説明文 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            💡
            このリンクをお客様に送信すると、お客様が予約内容を確認して同意できます。
          </p>
          <p className="text-sm text-gray-700 mt-2">
            同意後、自動的にリマインダーが送信されます。
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onNewReservation}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  )
}
