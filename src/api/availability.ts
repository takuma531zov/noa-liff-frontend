import type { Menu } from '../types'
import { getGasBaseUrl } from '../config'

// 予約済み時間枠の型定義
type BookedSlot = {
  startTime: string
  durationMin: number
}

// 時間枠の型定義
type TimeSlot = {
  hour: number
  min: number
}

// 予約済み時間枠を取得
export const fetchBookedSlots = async (
  staffId: string,
  date: string,
): Promise<BookedSlot[]> => {
  const response = await fetch(
    `${getGasBaseUrl()}?path=bookedSlots&staffId=${staffId}&date=${date}`,
  )
  return response.json()
}

// 利用可能な時間枠を計算
export const calculateAvailableSlots = (
  bookedSlots: BookedSlot[],
  totalDuration: number,
): TimeSlot[] => {
  const allSlots: TimeSlot[] = []
  for (let hour = 9; hour < 20; hour++) {
    for (const min of [0, 30]) {
      allSlots.push({ hour, min })
    }
  }

  return allSlots.filter((slot) => {
    const slotStartMinutes = slot.hour * 60 + slot.min
    const slotEndMinutes = slotStartMinutes + totalDuration

    if (slotEndMinutes > 20 * 60) return false

    for (const booked of bookedSlots) {
      const [bookedHour, bookedMin] = booked.startTime.split(':').map(Number)
      const bookedStartMinutes = bookedHour * 60 + bookedMin
      const bookedEndMinutes = bookedStartMinutes + booked.durationMin

      if (
        slotStartMinutes < bookedEndMinutes &&
        slotEndMinutes > bookedStartMinutes
      ) {
        return false
      }
    }

    return true
  })
}

// メニューの合計所要時間を計算
export const calculateTotalDuration = (
  menuList: Menu[],
  selectedMenuIds: string[],
): number => {
  const selectedMenus = menuList.filter((m) =>
    selectedMenuIds.includes(m.menuId),
  )
  return selectedMenus.reduce((sum, m) => sum + m.durationMin, 0)
}
