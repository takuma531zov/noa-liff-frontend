// デバッグモードフラグ
export const DEBUG_MODE = true

// 時間選択肢の設定
export const TIME_RANGE = {
  START_HOUR: 9,
  END_HOUR: 20,
  INTERVALS: ['00', '30'] as const,
} as const

// タイムアウト設定（ミリ秒）
export const TIMEOUTS = {
  LIFF_INIT: 30000,
  RELOAD_DELAY: 3000,
} as const
