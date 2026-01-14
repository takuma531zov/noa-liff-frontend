// 店舗設定ユーティリティ

// 店舗名→環境変数キーのマッピング
const STORE_ENV_KEY_MAP: Record<string, string> = {
  大宮店: 'STORE_TEL_NUM_OMIYA',
  北浦和店: 'STORE_TEL_NUM_KITAURAWA',
} as const

// 店舗の電話番号を取得
export const getStoreTelNum = (storeName: string): string | null => {
  const envKey = STORE_ENV_KEY_MAP[storeName]
  if (!envKey) return null

  return process.env[envKey] ?? null
}
