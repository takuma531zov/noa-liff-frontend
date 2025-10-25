import liff from '@line/liff'
import type { AppState } from '../types'
import { addDebugLog } from '../utils/debug'
import { showModal } from '../utils/modal'
import { clearErrorMessages } from '../utils/dom'
import { getSelectedMenuIds } from '../ui/form'
import {
  setSubmitButtonDisabled,
  setSubmitButtonText,
  showNewReservationScreen,
  showChangeScreenLoading,
  showChangeScreenNoReservation,
} from '../ui/screen'
import { showEditReservationForm } from '../ui/edit'
import {
  sendReservationRequest,
  fetchMyReservation,
} from '../api/reservation'
import { getElementById } from '../utils/dom'

// 予約送信ハンドラ
export const handleReservationSubmit = async (
  event: Event,
  state: AppState,
): Promise<void> => {
  event.preventDefault()

  clearErrorMessages()

  setSubmitButtonDisabled(true)
  setSubmitButtonText('送信中...')

  const menuIds = getSelectedMenuIds()

  if (menuIds.length === 0) {
    throw new Error('メニューを選択してください')
  }

  const isUpdateMode = state.currentReservation !== null

  const store = getElementById<HTMLInputElement>('store')?.value ?? ''
  const reservationDate =
    getElementById<HTMLInputElement>('reservationDate')?.value ?? ''
  const reservationTime =
    getElementById<HTMLInputElement>('reservationTime')?.value ?? ''
  const staffId = getElementById<HTMLInputElement>('staffId')?.value ?? ''
  const customerName =
    getElementById<HTMLInputElement>('customerName')?.value ?? ''
  const customerPhone =
    getElementById<HTMLInputElement>('customerPhone')?.value ?? ''
  const consent =
    getElementById<HTMLInputElement>('consent')?.checked ?? false

  const payload = {
    store,
    reservationDate,
    reservationTime,
    staffId,
    menuIds,
    customer: {
      fullName: customerName,
      phone: customerPhone,
      lineUserId: state.lineUserId,
      consent,
    },
    idempotencyKey: `${new Date().getTime()}-${state.lineUserId}`,
  }

  const request = isUpdateMode && state.currentReservation
    ? {
        action: 'updateReservation' as const,
        reservationId: state.currentReservation.reservationId,
        payload,
      }
    : {
        action: 'createReservation' as const,
        payload,
      }

  addDebugLog('予約送信開始')

  const result = await sendReservationRequest(request)

  if (result.success) {
    const successMessage = isUpdateMode
      ? 'ご予約内容を変更いたしました。\n\n次回のご来店を心よりお待ちしております！'
      : 'ご予約を承りました。\n\n次回のご来店を心よりお待ちしております！'

    showModal(successMessage, () => {
      state.currentReservation = null
      setSubmitButtonText('予約を確定する')
      liff.closeWindow()
    })
  } else {
    throw new Error(result.message || '予約に失敗しました')
  }
}

// 予約読み込みハンドラ
export const handleLoadMyReservation = async (
  state: AppState,
): Promise<void> => {
  showChangeScreenLoading()

  const data = await fetchMyReservation(state.lineUserId)

  if (!data.reservation) {
    showChangeScreenNoReservation()
    return
  }

  state.currentReservation = data.reservation
  showEditReservationForm(state.currentReservation)
}

// 予約編集ハンドラ（削除 - showEditReservationFormに統合）

// 予約キャンセルハンドラ
export const handleCancelReservation = async (
  state: AppState,
): Promise<void> => {
  const reservation = state.currentReservation
  if (!reservation) return

  const { date, time, staffName, menu, reservationId } = reservation

  showModal(
    `以下のご予約をキャンセルします。\nよろしいですか?\n\n予約日時: ${date} ${time}\n担当: ${staffName}様\nメニュー: ${menu}`,
    async () => {
      const result = await sendReservationRequest({
        action: 'cancelReservation',
        reservationId,
      })

      if (result.success) {
        showModal(
          'ご予約をキャンセルいたしました。\n\nまたのご利用をお待ちしております。',
          () => {
            showNewReservationScreen()
          },
        )
      } else {
        throw new Error(result.message || 'キャンセルに失敗しました')
      }
    },
  )
}
