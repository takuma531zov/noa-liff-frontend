// 環境変数から設定を読み込む（グローバル変数として定義される想定）
declare const LIFF_ID: string
declare const GAS_BASE_URL: string

// LIFF ID取得
export const getLiffId = (): string => LIFF_ID

// GAS Base URL取得
export const getGasBaseUrl = (): string => GAS_BASE_URL

// 設定値の検証
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  const liffIdValid = LIFF_ID?.length > 10 && !LIFF_ID.includes('{{')
  const gasUrlValid =
    GAS_BASE_URL?.startsWith('https://') && !GAS_BASE_URL.includes('{{')

  if (!liffIdValid) {
    errors.push(`LIFF ID無効（値: "${LIFF_ID}", length: ${LIFF_ID?.length})`)
  }

  if (!gasUrlValid) {
    errors.push(
      `GAS URL無効（値: "${GAS_BASE_URL}", length: ${GAS_BASE_URL?.length})`,
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
