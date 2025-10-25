import type { ModalCallback } from '../types'

// カスタムモーダルを表示
export const showModal = (
  message: string,
  onClose?: ModalCallback,
): void => {
  const modal = document.getElementById('customModal')
  const modalMessage = document.getElementById('modalMessage')
  const modalBtn = document.getElementById('modalBtn')

  if (!modal || !modalMessage || !modalBtn) return

  modalMessage.innerHTML = message.replace(/\n/g, '<br>')
  modal.classList.add('show')

  modalBtn.onclick = () => {
    modal.classList.remove('show')
    onClose?.()
  }
}

// 確認ダイアログを表示（OK/キャンセル）
export const showConfirm = (
  message: string,
  onConfirm: ModalCallback,
  onCancel?: ModalCallback,
): void => {
  const modal = document.getElementById('customModal')
  const modalMessage = document.getElementById('modalMessage')
  const modalBtn = document.getElementById('modalBtn')

  if (!modal || !modalMessage || !modalBtn) return

  modalMessage.innerHTML = message.replace(/\n/g, '<br>')
  modal.classList.add('show')

  // OKボタンのテキストを変更
  modalBtn.textContent = 'OK'

  // キャンセルボタンを作成（既存のものがあれば削除）
  const existingCancelBtn = document.getElementById('modalCancelBtn')
  if (existingCancelBtn) {
    existingCancelBtn.remove()
  }

  const cancelBtn = document.createElement('button')
  cancelBtn.id = 'modalCancelBtn'
  cancelBtn.className = 'modal-btn modal-cancel-btn'
  cancelBtn.textContent = 'キャンセル'
  cancelBtn.style.background = 'linear-gradient(135deg, #999 0%, #777 100%)'
  cancelBtn.style.marginLeft = '10px'

  modalBtn.parentElement?.appendChild(cancelBtn)

  modalBtn.onclick = () => {
    modal.classList.remove('show')
    cancelBtn.remove()
    modalBtn.textContent = 'OK'
    onConfirm()
  }

  cancelBtn.onclick = () => {
    modal.classList.remove('show')
    cancelBtn.remove()
    modalBtn.textContent = 'OK'
    onCancel?.()
  }
}
