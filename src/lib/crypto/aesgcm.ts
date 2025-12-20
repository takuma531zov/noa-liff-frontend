// AES-GCM による文字列暗号化/復号
import { fromBase64Url, toBase64Url, utf8Decode, utf8Encode } from './encode'
import { type Result, getAesKeyV1 } from './keys'

// 出力形式: enc:v1:iv=<b64url>:ct=<b64url>
const PREFIX = 'enc:v1:'

// 暗号化
export const encryptString = async (plain: string): Promise<Result<string>> => {
  const keyRes = await getAesKeyV1()
  if (!keyRes.ok) return keyRes
  const key = keyRes.value

  const iv = new Uint8Array(12)
  crypto.getRandomValues(iv)

  return crypto.subtle
    .encrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      utf8Encode(plain).buffer as ArrayBuffer,
    )
    .then((buf) => {
      const ct = new Uint8Array(buf)
      const payload = `${PREFIX}iv=${toBase64Url(iv)}:ct=${toBase64Url(ct)}`
      return { ok: true, value: payload } as const
    })
    .catch(() => ({ ok: false, error: '暗号化に失敗しました' }) as const)
}

// 復号
export const decryptString = async (
  payload: string,
): Promise<Result<string>> => {
  // 旧データ（平文）許容
  if (!payload || !payload.startsWith(PREFIX))
    return { ok: true, value: payload }

  const keyRes = await getAesKeyV1()
  if (!keyRes.ok) return keyRes
  const key = keyRes.value

  // フォーマット解析
  const without = payload.slice(PREFIX.length)
  const parts = without.split(':')
  const ivPart = parts.find((p) => p.startsWith('iv=')) || ''
  const ctPart = parts.find((p) => p.startsWith('ct=')) || ''
  const ivB64 = ivPart.replace('iv=', '')
  const ctB64 = ctPart.replace('ct=', '')
  const iv = fromBase64Url(ivB64)
  const ct = fromBase64Url(ctB64)

  if (!iv.byteLength || !ct.byteLength)
    return { ok: false, error: '復号入力が不正です' }

  return crypto.subtle
    .decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      ct.buffer as ArrayBuffer,
    )
    .then(
      (buf) => ({ ok: true, value: utf8Decode(new Uint8Array(buf)) }) as const,
    )
    .catch(() => ({ ok: false, error: '復号に失敗しました' }) as const)
}
