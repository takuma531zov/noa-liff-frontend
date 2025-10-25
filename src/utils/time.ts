import { TIME_RANGE } from '../constants'

// 時間選択肢を生成（9:00〜20:00、30分刻み）
export const generateTimeOptions = (): void => {
  const select = document.getElementById(
    'reservationTime',
  ) as HTMLSelectElement | null
  if (!select) return

  const { START_HOUR, END_HOUR, INTERVALS } = TIME_RANGE

  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    for (const min of INTERVALS) {
      const time = `${String(hour).padStart(2, '0')}:${min}`
      const option = document.createElement('option')
      option.value = time
      option.textContent = time
      select.appendChild(option)
    }
  }
}
