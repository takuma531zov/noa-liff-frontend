import type { Reservation } from '@/lib/supabase/types'

// 予約カードコンポーネント
type ReservationCardProps = {
  reservation: Reservation
  onEdit: (reservation: Reservation) => void
  onCancel: (reservation: Reservation) => void
}

export const ReservationCard = ({
  reservation,
  onEdit,
  onCancel,
}: ReservationCardProps) => {
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
      <div className="flex flex-col gap-2">
        {/* ヘッダー: 店舗・時間・ステータス */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-800 font-medium">
              {reservation.store}
            </span>
            <span className="text-lg font-bold text-gray-800">
              {reservation.reservation_time.slice(0, 5)}
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
          {reservation.customer_name ? (
            <div className="flex gap-2">
              <span className="text-gray-600">顧客名:</span>
              <span className="text-gray-800">{reservation.customer_name}</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <span className="text-gray-600">顧客名:</span>
              <span className="text-gray-400">未登録</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-gray-600">メニュー:</span>
            <span className="text-gray-800">{reservation.menu}</span>
          </div>
          {reservation.line_display_name && (
            <div className="flex gap-2">
              <span className="text-gray-600">LINE名:</span>
              <span className="text-gray-800">
                {reservation.line_display_name}
              </span>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        {reservation.status !== 'cancelled' && (
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => onEdit(reservation)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              予約内容変更
            </button>
            <button
              type="button"
              onClick={() => onCancel(reservation)}
              className="flex-1 px-4 py-2 bg-white text-red-600 text-sm font-medium border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
