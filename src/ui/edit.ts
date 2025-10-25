import type { Reservation } from '../types'
import { getElementById, setDisplay } from '../utils/dom'

// 編集モードでフォームを表示
export const showEditReservationForm = (
  reservation: Reservation,
): void => {
  setDisplay('loading', 'none')
  setDisplay('reservationForm', 'block')
  setDisplay('noReservationMessage', 'none')

  // ヘッダー更新
  const headerSubtitle = getElementById('headerSubtitle')
  if (headerSubtitle) headerSubtitle.textContent = 'ご予約内容の変更'

  const changeLinkBtn = getElementById('changeLinkBtn')
  if (changeLinkBtn) {
    changeLinkBtn.style.display = 'block'
    changeLinkBtn.textContent = '新規予約に戻る'
  }

  // 現在の予約情報ボックスを表示
  setDisplay('currentReservationInfo', 'block')
  setDisplay('editModeTitle', 'block')

  const infoStore = getElementById('infoStore')
  const infoStaff = getElementById('infoStaff')
  const infoMenu = getElementById('infoMenu')
  const infoDateTime = getElementById('infoDateTime')

  if (infoStore) infoStore.textContent = reservation.store
  if (infoStaff) infoStaff.textContent = reservation.staffName
  if (infoMenu) infoMenu.textContent = reservation.menu
  if (infoDateTime)
    infoDateTime.textContent = `${reservation.date} ${reservation.time}`

  // 店舗・スタッフを非表示（変更不可）
  const storeGroup = document.querySelector('#store')?.closest('.form-group') as HTMLElement | null
  const staffIdGroup = document.querySelector('#staffId')?.closest('.form-group') as HTMLElement | null
  if (storeGroup) storeGroup.style.display = 'none'
  if (staffIdGroup) staffIdGroup.style.display = 'none'

  // お名前・電話・同意を非表示
  const customerNameGroup = document.querySelector('#customerName')?.closest('.form-group') as HTMLElement | null
  const customerPhoneGroup = document.querySelector('#customerPhone')?.closest('.form-group') as HTMLElement | null
  const consentGroup = document.querySelector('#consent')?.closest('.form-group') as HTMLElement | null
  if (customerNameGroup) customerNameGroup.style.display = 'none'
  if (customerPhoneGroup) customerPhoneGroup.style.display = 'none'
  if (consentGroup) consentGroup.style.display = 'none'

  // フォームに既存値をセット
  const store = getElementById<HTMLSelectElement>('store')
  const staffId = getElementById<HTMLSelectElement>('staffId')
  const reservationDate = getElementById<HTMLInputElement>('reservationDate')
  const reservationTime = getElementById<HTMLSelectElement>('reservationTime')
  const customerName = getElementById<HTMLInputElement>('customerName')
  const customerPhone = getElementById<HTMLInputElement>('customerPhone')
  const consent = getElementById<HTMLInputElement>('consent')

  if (store) store.value = reservation.store
  if (staffId) staffId.value = reservation.staffId
  if (reservationDate)
    reservationDate.value = reservation.date.replace(/\//g, '-')
  if (reservationTime) reservationTime.value = reservation.time
  if (customerName) customerName.value = reservation.customerName
  if (customerPhone) customerPhone.value = reservation.phone
  if (consent) consent.checked = true

  // メニューはクリア（ユーザーに再選択してもらう）
  for (const cb of Array.from(
    document.querySelectorAll<HTMLInputElement>('input[name="menuIds"]'),
  )) {
    cb.checked = false
  }

  // 希望時間フィールドを初期無効化（メニュー選択後に有効化される）
  if (reservationTime) {
    reservationTime.disabled = true
    reservationTime.innerHTML = '<option value="">選択してください</option>'
  }

  // 送信ボタンとキャンセルボタンを表示
  const submitBtn = getElementById('submitBtn')
  const cancelBtn = getElementById('cancelReservationBtn')
  if (submitBtn) submitBtn.textContent = '変更を確定する'
  if (cancelBtn) cancelBtn.style.display = 'block'
}
