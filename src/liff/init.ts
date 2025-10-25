import liff from '@line/liff'
import type { AppState } from '../types'
import { getLiffId, getGasBaseUrl, validateConfig } from '../config'
import { TIMEOUTS } from '../constants'
import { addDebugLog } from '../utils/debug'
import { fetchStaffList, fetchMenuList } from '../api/reservation'
import { populateMenuCheckboxes, populateStaffSelect } from '../ui/form'
import { showForm } from '../ui/screen'
import { generateTimeOptions } from '../utils/time'

// LIFF初期化とマスタデータ読み込み
export const initializeLiff = async (state: AppState): Promise<void> => {
  addDebugLog('LIFF初期化開始')
  addDebugLog(`LIFF_ID: ${getLiffId()}`)
  addDebugLog(`GAS_URL: ${getGasBaseUrl()}`)

  // 設定値の検証
  const validation = validateConfig()
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '))
  }

  // LIFF初期化
  addDebugLog('liff.init()呼び出し中...')
  const initStartTime = Date.now()

  const timeoutId = setTimeout(() => {
    addDebugLog('⚠️ liff.init()が30秒経過しても完了しません')
  }, TIMEOUTS.LIFF_INIT)

  await liff.init({
    liffId: getLiffId(),
    withLoginOnExternalBrowser: true,
  })

  clearTimeout(timeoutId)
  const initDuration = Date.now() - initStartTime
  addDebugLog(`✅ LIFF初期化成功（${initDuration}ms）`)

  const isLoggedIn = liff.isLoggedIn()
  const isInClient = liff.isInClient()
  addDebugLog(`ログイン状態: ${isLoggedIn}`)
  addDebugLog(`LINEアプリ内: ${isInClient}`)

  // ログインチェック
  if (!isLoggedIn) {
    addDebugLog('未ログイン状態 - ログインが必要です')
    if (!isInClient) {
      addDebugLog('外部ブラウザからのアクセス - ログインリダイレクト')
      liff.login({ redirectUri: window.location.href })
      throw new Error('ログインが必要です')
    }
    throw new Error('LINEアプリ内ですがログインできていません')
  }

  // LINE userId取得
  addDebugLog('liff.getProfile()呼び出し中...')
  const profile = await liff.getProfile()
  state.lineUserId = profile.userId
  addDebugLog(`✅ LINE userId取得成功: ${state.lineUserId.substring(0, 10)}...`)

  // スタッフとメニューのデータ取得（並列化）
  addDebugLog('マスタデータ取得中...')
  const [staffList, menuList] = await Promise.all([
    fetchStaffList(),
    fetchMenuList(),
  ])
  state.staffList = staffList
  state.menuList = menuList
  addDebugLog('✅ マスタデータ取得成功')

  // UIに反映
  populateStaffSelect(state.staffList)
  populateMenuCheckboxes(state.menuList)

  // フォーム表示
  addDebugLog('フォーム表示')
  showForm()
  generateTimeOptions()
}

// 認証エラーハンドリング
export const handleAuthError = (error: Error): void => {
  const isCodeVerifierError =
    error.message?.includes('code_verifier') ||
    (error as { code?: string }).code === 'invalid_grant'

  if (!isCodeVerifierError) {
    throw error
  }

  addDebugLog('認証エラー検出 - URLパラメータをクリアして再ログイン')

  const cleanUrl = `${window.location.origin}${window.location.pathname}`

  // sessionStorageをクリア
  sessionStorage.clear()
  addDebugLog('sessionStorageクリア完了')

  // 3秒後にクリーンなURLで再読み込み
  setTimeout(() => {
    addDebugLog('ページを再読み込みします...')
    window.location.href = cleanUrl
  }, TIMEOUTS.RELOAD_DELAY)

  throw new Error('認証エラーが発生しました。ページを再読み込みしています...')
}
