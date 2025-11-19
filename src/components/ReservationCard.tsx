import type { Reservation } from '@/lib/supabase/types'

// 予約カードコンポーネント
type ReservationCardProps = {
  reservation: Reservation
}

export const ReservationCard = ({ reservation }: ReservationCardProps) => {
  // ステータスに応じたスタイル
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-500'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  // ステータスの日本語表示
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '確定'
      case 'cancelled':
        return 'キャンセル'
      default:
        return '未同意'
    }
  }

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex flex-col gap-3">
        {/* ヘッダー: 日時とステータス */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800">
              {formatDate(reservation.reservation_date)}{' '}
              {reservation.reservation_time.slice(0, 5)}
            </span>
            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              {reservation.store}
            </span>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${getStatusStyle(reservation.status)}`}
          >
            {getStatusLabel(reservation.status)}
          </span>
        </div>

        {/* 予約詳細 */}
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-600">担当:</span>
            <span className="font-medium text-gray-800">
              {reservation.staff_name}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600">メニュー:</span>
            <span className="text-gray-800">{reservation.menu}</span>
          </div>
        </div>

        {/* 顧客情報 */}
        <div className="flex flex-col gap-1 text-sm border-t border-gray-200 pt-3">
          {reservation.customer_name && (
            <div className="flex gap-2">
              <span className="text-gray-600">顧客名:</span>
              <span className="text-gray-800">{reservation.customer_name}</span>
            </div>
          )}
          {reservation.line_display_name && (
            <div className="flex gap-2">
              <span className="text-gray-600">LINE名:</span>
              <span className="text-gray-800">
                {reservation.line_display_name}
              </span>
            </div>
          )}
          {!reservation.customer_name && !reservation.line_display_name && (
            <span className="text-gray-400 text-xs">顧客情報未登録</span>
          )}
        </div>
      </div>
    </div>
  )
}
