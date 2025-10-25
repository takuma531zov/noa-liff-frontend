import { DEBUG_MODE } from '../constants'

// デバッグ情報をDOMに追加
export const addDebugLog = (message: string): void => {
  console.log(message)

  if (!DEBUG_MODE) return

  const debugDiv = document.getElementById('debugInfo')
  if (!debugDiv) return

  debugDiv.style.display = 'block'
  const timestamp = new Date().toLocaleTimeString('ja-JP')
  debugDiv.innerHTML += `[${timestamp}] ${message}<br>`
}
