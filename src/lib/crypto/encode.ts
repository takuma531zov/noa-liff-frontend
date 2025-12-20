// 文字列・バイト列・Base64URL のユーティリティ

// UTF-8エンコード
export const utf8Encode = (text: string): Uint8Array =>
  new TextEncoder().encode(text)

// UTF-8デコード
export const utf8Decode = (bytes: Uint8Array): string =>
  new TextDecoder().decode(bytes)

// Base64エンコード（環境依存を吸収）
const b64encode = (bytes: Uint8Array): string => {
  if (typeof Buffer !== 'undefined')
    return Buffer.from(bytes).toString('base64')
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  // @ts-ignore Edge/Deno 環境では btoa が存在
  return btoa(binary)
}

// Base64デコード（環境依存を吸収）
const b64decode = (b64: string): Uint8Array => {
  if (typeof Buffer !== 'undefined')
    return new Uint8Array(Buffer.from(b64, 'base64'))
  // @ts-ignore Edge/Deno 環境では atob が存在
  const bin: string = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff
  return out
}

// Base64URL 相互変換
export const toBase64Url = (bytes: Uint8Array): string =>
  b64encode(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')

export const fromBase64Url = (b64url: string): Uint8Array =>
  b64decode(b64url.replaceAll('-', '+').replaceAll('_', '/'))
