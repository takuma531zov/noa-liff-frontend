// データベーステーブルの型定義

// スタッフ
export type Staff = {
  id: string
  name: string
  stores: string[] // 複数店舗対応（配列）
  is_active: boolean
  created_at: string
  updated_at: string
}

// 予約ステータス
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'

// リマインダージョブステータス
export type ReminderJobStatus = 'pending' | 'sent' | 'failed' | 'cancelled'

// リマインダー種別
export type RemindType = '7days_before' | '1day_before'

// reservationsテーブル
export type Reservation = {
  id: string
  store: string
  staff_name: string
  menu: string
  reservation_date: string
  reservation_time: string
  customer_name: string | null
  line_display_name: string | null
  line_user_id: string | null
  consent: boolean
  consent_token: string
  status: ReservationStatus
  created_at: string
  updated_at: string
}

// reminder_jobsテーブル
export type ReminderJob = {
  id: string
  reservation_id: string
  remind_type: RemindType
  scheduled_at: string
  sent_at: string | null
  status: ReminderJobStatus
  error_message: string | null
  created_at: string
  updated_at: string
}

// 予約登録リクエスト
export type CreateReservationInput = {
  store: string
  staff_name: string
  menu: string
  reservation_date: string
  reservation_time: string
  customer_name?: string
}

// 予約更新リクエスト
export type UpdateReservationInput = Partial<CreateReservationInput>

// 予約登録APIレスポンス
export type CreateReservationResponse = {
  success: true
  reservationId: string
  consentUrl: string
}
