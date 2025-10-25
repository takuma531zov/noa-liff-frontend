// DOM要素を安全に取得するヘルパー関数
export const getElementById = <T extends HTMLElement>(
  id: string,
): T | null => document.getElementById(id) as T | null

// 要素の表示/非表示を切り替え
export const setDisplay = (
  id: string,
  display: 'block' | 'none',
): void => {
  const element = getElementById(id)
  if (element) {
    element.style.display = display
  }
}

// エラーメッセージをすべてクリア
export const clearErrorMessages = (): void => {
  for (const el of Array.from(document.querySelectorAll('.error-message'))) {
    el.classList.remove('show')
  }
}
