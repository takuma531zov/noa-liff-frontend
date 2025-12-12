// 内部ログイン用の簡易トークン生成/検証（HMAC署名・Cookie用）
// - 目的: 管理UI/APIのCookieガード
// - 仕様: { sub: 'internal', exp: unix(ms) } をHMAC署名（base64url）

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// base64/base64url ユーティリティ（Node/Edge両対応）
const b64encode = (bytes: Uint8Array) => {
  if (typeof Buffer !== 'undefined')
    return Buffer.from(bytes).toString('base64')
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  // Edge Runtime では btoa が存在する
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return btoa(binary)
}
const b64decode = (b64: string) => {
  if (typeof Buffer !== 'undefined')
    return new Uint8Array(Buffer.from(b64, 'base64'))
  // Edge Runtime では atob が存在する
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff
  return out
}
const toBase64Url = (bytes: Uint8Array) =>
  b64encode(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
const fromBase64Url = (b64url: string) =>
  b64decode(b64url.replaceAll('-', '+').replaceAll('_', '/'))

// 署名生成
const sign = async (payload: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return new Uint8Array(sig)
}

// トークン生成（有効期限: days日）
export const createSessionToken = async (days: number) => {
  const secret = process.env.INTERNAL_AUTH_SECRET
  if (!secret) throw new Error('INTERNAL_AUTH_SECRET が未設定です')

  const payloadObj = {
    sub: 'internal',
    exp: Date.now() + days * 24 * 60 * 60 * 1000,
  }
  const payload = JSON.stringify(payloadObj)
  const sig = await sign(payload, secret)
  return `${toBase64Url(encoder.encode(payload))}.${toBase64Url(sig)}`
}

// トークン検証（有効かつ未期限切れか）
export const verifySessionToken = async (token: string) => {
  const secret = process.env.INTERNAL_AUTH_SECRET
  if (!secret) return false
  const [payloadB64, sigB64] = token.split('.')
  if (!payloadB64 || !sigB64) return false

  const payloadBytes = fromBase64Url(payloadB64)
  const payloadJson = decoder.decode(payloadBytes)
  const expectedSig = await sign(payloadJson, secret)
  const actualSig = fromBase64Url(sigB64)

  if (toBase64Url(expectedSig) !== toBase64Url(new Uint8Array(actualSig)))
    return false

  const payload = JSON.parse(payloadJson) as { sub: string; exp: number }
  return (
    payload.sub === 'internal' &&
    typeof payload.exp === 'number' &&
    Date.now() < payload.exp
  )
}
