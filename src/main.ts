import type { AppState } from './types'
import { addDebugLog } from './utils/debug'
import { showModal } from './utils/modal'
import { getElementById } from './utils/dom'
import { generateTimeOptions } from './utils/time'
import { initializeLiff, handleAuthError } from './liff/init'
import { showNewReservationScreen } from './ui/screen'
import { setupAvailabilityListeners } from './ui/availability'
import {
  handleReservationSubmit,
  handleLoadMyReservation,
  handleCancelReservation,
} from './reservation/handlers'

// アプリケーション状態
const state: AppState = {
  lineUserId: '',
  staffList: [],
  menuList: [],
  currentReservation: null,
}

// エラーハンドリング用ラッパー
const withErrorHandling =
  <T extends unknown[]>(fn: (...args: T) => Promise<void>) =>
  async (...args: T): Promise<void> => {
    const submitBtn = getElementById('submitBtn')

    try {
      await fn(...args)
    } catch (error) {
      const err = error as Error
      console.error('エラー:', err)
      addDebugLog(`❌ エラー: ${err.message}`)

      let errorMsg = ''
      if (
        err.message.includes('Failed to fetch') ||
        err.message.includes('Load failed')
      ) {
        errorMsg =
          '申し訳ございません。\n\n通信エラーが発生しました。\nインターネット接続をご確認の上、\nもう一度お試しください。'
      } else if (err.message.startsWith('入力エラー')) {
        errorMsg = err.message
      } else {
        errorMsg = `申し訳ございません。\n\n${err.message}\n\nお手数ですが、もう一度お試しいただくか、\nお電話にてお問い合わせください。`
      }

      showModal(errorMsg)

      if (submitBtn) {
        submitBtn.textContent = '予約を確定する'
        ;(submitBtn as HTMLButtonElement).disabled = false
      }
    }
  }

// アプリケーション初期化
const initializeApp = async (): Promise<void> => {
  try {
    await initializeLiff(state)
    generateTimeOptions()
    setupAvailabilityListeners(state)
  } catch (error) {
    const err = error as Error
    console.error('LIFF初期化エラー:', err)
    handleAuthError(err)
  }
}

// イベントリスナー設定
const setupEventListeners = (): void => {
  // フォーム送信
  const form = getElementById<HTMLFormElement>('reservationForm')
  form?.addEventListener('submit', withErrorHandling((e: Event) => handleReservationSubmit(e, state)))

  // 画面切り替え（予約変更 ⇔ 新規予約）
  getElementById('changeLinkBtn')?.addEventListener('click', (e) => {
    e.preventDefault()
    if (state.currentReservation === null) {
      // 新規予約画面 → 予約変更画面
      withErrorHandling(() => handleLoadMyReservation(state))()
    } else {
      // 予約変更画面 → 新規予約画面
      state.currentReservation = null
      showNewReservationScreen()
    }
  })

  // 予約キャンセル
  getElementById('cancelReservationBtn')?.addEventListener(
    'click',
    withErrorHandling(() => handleCancelReservation(state)),
  )
}

// アプリケーション起動
const bootstrap = async (): Promise<void> => {
  setupEventListeners()
  await withErrorHandling(() => initializeApp())()
}

// DOMContentLoaded後に起動
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap)
} else {
  bootstrap()
}
