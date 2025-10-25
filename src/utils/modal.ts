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
