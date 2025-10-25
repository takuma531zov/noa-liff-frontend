import type {
  ApiRequest,
  ApiResponse,
  Menu,
  Reservation,
  Staff,
} from '../types'
import { getGasBaseUrl } from '../config'

// スタッフ一覧を取得
export const fetchStaffList = async (): Promise<Staff[]> => {
  const response = await fetch(`${getGasBaseUrl()}?path=staff`)
  return response.json()
}

// メニュー一覧を取得
export const fetchMenuList = async (): Promise<Menu[]> => {
  const response = await fetch(`${getGasBaseUrl()}?path=menus`)
  return response.json()
}

// 自分の予約を取得
export const fetchMyReservation = async (
  lineUserId: string,
): Promise<{ reservation: Reservation | null }> => {
  const response = await fetch(
    `${getGasBaseUrl()}?path=myReservation&lineUserId=${lineUserId}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'text/plain' },
    },
  )
  return response.json()
}

// 予約リクエストを送信
export const sendReservationRequest = async (
  request: ApiRequest,
): Promise<ApiResponse> => {
  const response = await fetch(getGasBaseUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`サーバーエラー (${response.status}): ${errorText.substring(0, 100)}`)
  }

  return response.json()
}

// GAS エンドポイント接続テスト
export const testGasConnection = async (): Promise<boolean> => {
  const response = await fetch(`${getGasBaseUrl()}?path=staff`, {
    method: 'GET',
    mode: 'cors',
  })
  return response.ok
}
