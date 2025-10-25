// スタッフ情報の型定義
export type Staff = {
  staffId: string
  staffName: string
}

// メニュー情報の型定義
export type Menu = {
  menuId: string
  menuName: string
  durationMin: number
}

// 予約情報の型定義
export type Reservation = {
  reservationId: string
  store: string
  date: string
  time: string
  staffId: string
  staffName: string
  menu: string
  menuIds?: string[]
  customerName: string
  phone: string
}

// 顧客情報の型定義
export type Customer = {
  fullName: string
  phone: string
  lineUserId: string
  consent: boolean
}

// 予約作成ペイロードの型定義
export type CreateReservationPayload = {
  store: string
  reservationDate: string
  reservationTime: string
  staffId: string
  menuIds: string[]
  customer: Customer
  idempotencyKey: string
}

// 予約更新ペイロードの型定義
export type UpdateReservationPayload = CreateReservationPayload

// APIリクエストの型定義
export type ApiRequest =
  | {
      action: 'createReservation'
      payload: CreateReservationPayload
    }
  | {
      action: 'updateReservation'
      reservationId: string
      payload: UpdateReservationPayload
    }
  | {
      action: 'cancelReservation'
      reservationId: string
    }

// APIレスポンスの型定義
export type ApiResponse = {
  success: boolean
  message?: string
  reservation?: Reservation
}

// アプリケーション状態の型定義
export type AppState = {
  lineUserId: string
  staffList: Staff[]
  menuList: Menu[]
  currentReservation: Reservation | null
}

// モーダルコールバックの型定義
export type ModalCallback = () => void

// スクリーン種別の型定義
export type ScreenType = 'new' | 'change'
