import type { Reservation } from '../types'
import { getElementById, setDisplay } from '../utils/dom'
import { generateTimeOptions } from '../utils/time'
import { resetForm } from './form'

// generateTimeOptionsを再エクスポート
export { generateTimeOptions }

// 画面切り替え：新規予約
export const showNewReservationScreen = (): void => {
  setDisplay('reservationForm', 'block')
  setDisplay('noReservationMessage', 'none')
  setDisplay('loading', 'none')

  const changeLinkBtn = getElementById('changeLinkBtn')
  if (changeLinkBtn) {
    changeLinkBtn.style.display = 'block'
    changeLinkBtn.textContent = '予約の変更はこちら'
  }

  const subtitle = getElementById('headerSubtitle')
  if (subtitle) subtitle.textContent = 'ご予約フォーム'

  // 編集モード用要素を非表示
  setDisplay('currentReservationInfo', 'none')
  setDisplay('editModeTitle', 'none')

  // 全フォームグループを表示に戻す
  const storeGroup = document.querySelector('#store')?.closest('.form-group') as HTMLElement | null
  const staffIdGroup = document.querySelector('#staffId')?.closest('.form-group') as HTMLElement | null
  const customerNameGroup = document.querySelector('#customerName')?.closest('.form-group') as HTMLElement | null
  const customerPhoneGroup = document.querySelector('#customerPhone')?.closest('.form-group') as HTMLElement | null
  const consentGroup = document.querySelector('#consent')?.closest('.form-group') as HTMLElement | null

  if (storeGroup) storeGroup.style.display = 'block'
  if (staffIdGroup) staffIdGroup.style.display = 'block'
  if (customerNameGroup) customerNameGroup.style.display = 'block'
  if (customerPhoneGroup) customerPhoneGroup.style.display = 'block'
  if (consentGroup) consentGroup.style.display = 'block'

  resetForm()
  const submitBtn = getElementById('submitBtn')
  if (submitBtn) submitBtn.textContent = '予約を確定する'

  const cancelBtn = getElementById('cancelReservationBtn')
  if (cancelBtn) cancelBtn.style.display = 'none'

  generateTimeOptions()
}

// 画面切り替え：予約変更（ローディング表示）
export const showChangeScreenLoading = (): void => {
  setDisplay('reservationForm', 'none')
  setDisplay('noReservationMessage', 'none')
  setDisplay('loading', 'block')
}

// 画面切り替え：予約変更（予約なし）
export const showChangeScreenNoReservation = (): void => {
  setDisplay('loading', 'none')
  setDisplay('reservationForm', 'none')
  setDisplay('noReservationMessage', 'block')

  const changeLinkBtn = getElementById('changeLinkBtn')
  if (changeLinkBtn) {
    changeLinkBtn.style.display = 'block'
    changeLinkBtn.textContent = '新規予約に戻る'
  }

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
