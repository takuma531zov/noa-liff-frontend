import type { Menu, Reservation, Staff } from '../types'
import { getElementById } from '../utils/dom'

// スタッフ選択肢を生成
export const populateStaffSelect = (staffList: Staff[]): void => {
  const select = getElementById<HTMLSelectElement>('staffId')
  if (!select) return

  for (const staff of staffList) {
    const option = document.createElement('option')
    option.value = staff.staffId
    option.textContent = staff.staffName
    select.appendChild(option)
  }
}

// メニューチェックボックスを生成
export const populateMenuCheckboxes = (menuList: Menu[]): void => {
  const container = getElementById('menuCheckboxes')
  if (!container) return

  for (const menu of menuList) {
    const div = document.createElement('div')
    div.className = 'menu-checkbox-item'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.id = `menu-${menu.menuId}`
    checkbox.name = 'menuIds'
    checkbox.value = menu.menuId

    const label = document.createElement('label')
    label.htmlFor = `menu-${menu.menuId}`
    label.innerHTML = `
      <span>${menu.menuName}</span>
      <span class="menu-duration">${menu.durationMin}分</span>
    `

    div.appendChild(checkbox)
    div.appendChild(label)
    container.appendChild(div)
  }
}

// フォームに予約情報をセット
export const setFormValues = (reservation: Reservation): void => {
  const store = getElementById<HTMLSelectElement>('store')
  const staffId = getElementById<HTMLSelectElement>('staffId')
  const reservationDate = getElementById<HTMLInputElement>('reservationDate')
  const reservationTime = getElementById<HTMLSelectElement>('reservationTime')
  const customerName = getElementById<HTMLInputElement>('customerName')
  const customerPhone = getElementById<HTMLInputElement>('customerPhone')

  if (store) store.value = reservation.store
  if (staffId) staffId.value = reservation.staffId
  if (reservationDate)
    reservationDate.value = reservation.date.replace(/\//g, '-')
  if (reservationTime) reservationTime.value = reservation.time
  if (customerName) customerName.value = reservation.customerName
  if (customerPhone) customerPhone.value = reservation.phone
}

// フォームをリセット
export const resetForm = (): void => {
  const form = getElementById<HTMLFormElement>('reservationForm')
  form?.reset()
}

// 選択されたメニューIDを取得
export const getSelectedMenuIds = (): string[] =>
  Array.from(document.querySelectorAll<HTMLInputElement>('input[name="menuIds"]:checked')).map(
    (cb) => cb.value,
  )
