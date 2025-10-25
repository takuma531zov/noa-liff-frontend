import type { Reservation } from '../types'
import { getElementById, setDisplay } from '../utils/dom'
import { generateTimeOptions } from '../utils/time'
import { resetForm } from './form'

// generateTimeOptionsを再エクスポート
export { generateTimeOptions }

// 画面切り替え：新規予約
export const showNewReservationScreen = (): void => {
  setDisplay('reservationForm', 'block')
  setDisplay('changeScreen', 'none')
  setDisplay('changeLinkBtn', 'block')

  const subtitle = getElementById('headerSubtitle')
  if (subtitle) subtitle.textContent = 'ご予約フォーム'

  resetForm()
  generateTimeOptions()
}

// 画面切り替え：予約変更
export const showChangeScreen = (): void => {
  setDisplay('reservationForm', 'none')
  setDisplay('changeScreen', 'block')
  setDisplay('changeLinkBtn', 'none')

  const subtitle = getElementById('headerSubtitle')
  if (subtitle) subtitle.textContent = 'ご予約の変更'
}

// 予約詳細を表示
export const displayReservationDetails = (
  reservation: Reservation,
): void => {
  const detailDateTime = getElementById('detailDateTime')
  const detailStaff = getElementById('detailStaff')
  const detailMenu = getElementById('detailMenu')
  const detailStore = getElementById('detailStore')

  if (detailDateTime)
    detailDateTime.textContent = `${reservation.date} ${reservation.time}`
  if (detailStaff) detailStaff.textContent = `${reservation.staffName}様`
  if (detailMenu) detailMenu.textContent = reservation.menu
  if (detailStore) detailStore.textContent = reservation.store
}

// 予約詳細画面を表示
export const showReservationDetails = (): void => {
  setDisplay('reservationDetails', 'block')
  setDisplay('noReservationMessage', 'none')
}

// 予約なしメッセージを表示
export const showNoReservationMessage = (): void => {
  setDisplay('reservationDetails', 'none')
  setDisplay('noReservationMessage', 'block')
}

// ローディング表示
export const showLoading = (): void => {
  setDisplay('loading', 'block')
  setDisplay('reservationForm', 'none')
}

// フォーム表示
export const showForm = (): void => {
  setDisplay('loading', 'none')
  setDisplay('reservationForm', 'block')
  setDisplay('changeLinkBtn', 'block')
}

// 送信ボタンのテキストを更新
export const setSubmitButtonText = (text: string): void => {
  const submitBtn = getElementById('submitBtn')
  if (submitBtn) submitBtn.textContent = text
}

// 送信ボタンの有効/無効を切り替え
export const setSubmitButtonDisabled = (disabled: boolean): void => {
  const submitBtn = getElementById<HTMLButtonElement>('submitBtn')
  if (submitBtn) submitBtn.disabled = disabled
}
