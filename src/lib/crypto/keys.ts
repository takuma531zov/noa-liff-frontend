// 顧客データ暗号化用の鍵管理
import { fromBase64Url } from './encode'

// 結果型
export type Ok<T> = { ok: true; value: T }
export type Err = { ok: false; error: string }
export type Result<T> = Ok<T> | Err

// 環境変数からAES-GCM鍵を生成
export const getAesKeyV1 = async (): Promise<Result<CryptoKey>> => {
  const keyB64 = process.env.CUSTOMER_AES_KEY_V1 || ''
  if (!keyB64) return { ok: false, error: 'CUSTOMER_AES_KEY_V1 未設定' }

  const raw = fromBase64Url(keyB64)
  if (raw.byteLength !== 32)
    return { ok: false, error: '鍵長が不正（32B必要）' }

  return crypto.subtle
    .importKey('raw', raw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt',
    ])
    .then((k) => ({ ok: true, value: k }) as Ok<CryptoKey>)
    .catch(() => ({ ok: false, error: '鍵インポート失敗' }) as Err)
}
