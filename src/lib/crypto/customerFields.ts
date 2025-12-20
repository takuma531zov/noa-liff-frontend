// 顧客関連フィールド専用の暗号化/復号ラッパ
import { decryptString, encryptString } from './aesgcm'

// 顧客名
export const encryptCustomerName = (v: string) => encryptString(v)
export const decryptCustomerName = (v: string) => decryptString(v)

// LINE表示名
export const encryptLineDisplayName = (v: string) => encryptString(v)
export const decryptLineDisplayName = (v: string) => decryptString(v)

// LINEユーザーID
export const encryptLineUserId = (v: string) => encryptString(v)
export const decryptLineUserId = (v: string) => decryptString(v)
