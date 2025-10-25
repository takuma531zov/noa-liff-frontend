import type { AppState } from '../types'
import { getElementById } from '../utils/dom'
import {
  fetchBookedSlots,
  calculateAvailableSlots,
  calculateTotalDuration,
} from '../api/availability'

// 利用可能時間枠のみ表示（予約済みを除外）
export const updateAvailableTimeSlots = async (
  state: AppState,
): Promise<void> => {
  const staffId =
    getElementById<HTMLSelectElement>('staffId')?.value ?? ''
  const date =
    getElementById<HTMLInputElement>('reservationDate')?.value ?? ''
  const menuIds = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[name="menuIds"]:checked',
    ),
  ).map((cb) => cb.value)

  // 予約変更モード時は既存予約のメニュー情報を使用
  const isEditMode = state.currentReservation !== null
  const effectiveMenuIds = isEditMode && menuIds.length === 0
    ? state.currentReservation?.menuIds ?? []
    : menuIds

  if (!staffId || !date || effectiveMenuIds.length === 0) {
    return
  }

  const select = getElementById<HTMLSelectElement>('reservationTime')
  if (!select) return

  select.disabled = true
  select.innerHTML = '<option value="">読み込み中...</option>'

  try {
    const totalDuration = calculateTotalDuration(state.menuList, effectiveMenuIds)
    const excludeReservationId = state.currentReservation?.reservationId
    const bookedSlots = await fetchBookedSlots(staffId, date, excludeReservationId)
    const availableSlots = calculateAvailableSlots(bookedSlots, totalDuration)

    select.disabled = false
    select.innerHTML = '<option value="">選択してください</option>'

    if (availableSlots.length === 0) {
      const option = document.createElement('option')
      option.value = ''
      option.textContent = '予約可能な時間がありません'
      option.disabled = true
      select.appendChild(option)
    } else {
      for (const slot of availableSlots) {
        const time = `${String(slot.hour).padStart(2, '0')}:${String(slot.min).padStart(2, '0')}`
        const option = document.createElement('option')
        option.value = time
        option.textContent = time
        select.appendChild(option)
      }
    }
  } catch (error) {
    console.error('利用可能時間の取得エラー:', error)
    select.disabled = false
    select.innerHTML = '<option value="">時間枠の取得に失敗しました</option>'
  }
}

// 必要項目に応じて希望時間の有効/無効を切り替え
export const toggleDateTimeFieldsBasedOnMenu = (
  state: AppState,
): void => {
  const staffId =
    getElementById<HTMLSelectElement>('staffId')?.value ?? ''
  const date =
    getElementById<HTMLInputElement>('reservationDate')?.value ?? ''
  const menuIds = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[name="menuIds"]:checked',
    ),
  ).map((cb) => cb.value)

  // 予約変更モード時は既存予約のメニュー情報を使用
  const isEditMode = state.currentReservation !== null
  const effectiveMenuIds = isEditMode && menuIds.length === 0
    ? state.currentReservation?.menuIds ?? []
    : menuIds

  // 必要項目が揃っているかチェック
  const hasRequiredFields = staffId && date && effectiveMenuIds.length > 0
  const timeField = getElementById<HTMLSelectElement>('reservationTime')

  if (timeField) {
    timeField.disabled = !hasRequiredFields
    if (!hasRequiredFields) {
      timeField.innerHTML = '<option value="">選択してください</option>'
    }
  }
}

// イベントリスナーを設定
export const setupAvailabilityListeners = (
  state: AppState,
): void => {
  const updateHandler = () => {
    toggleDateTimeFieldsBasedOnMenu(state)
    updateAvailableTimeSlots(state)
  }

  getElementById('staffId')?.addEventListener('change', updateHandler)
  getElementById('reservationDate')?.addEventListener(
    'change',
    updateHandler,
  )
  for (const checkbox of Array.from(
    document.querySelectorAll<HTMLInputElement>('input[name="menuIds"]'),
  )) {
    checkbox.addEventListener('change', updateHandler)
  }

  // 初期状態を設定
  toggleDateTimeFieldsBasedOnMenu(state)
}
