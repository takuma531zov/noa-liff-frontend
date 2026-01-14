// @ts-nocheck
// Supabase Edge Function 雛形: 期限到来のリマインダーを送信
// - 5分おきのスケジュールで実行想定
// - reservations.status = 'confirmed' かつ line_user_id があるもののみ送信

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Base64URL ユーティリティ
const fromBase64Url = (b64url: string): Uint8Array => {
  const b64 = b64url.replaceAll('-', '+').replaceAll('_', '/')
  // @ts-ignore Deno環境の atob
  const bin: string = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff
  return out
}

// 顧客データ復号（enc:v1:iv=..:ct=.. or 平文）
const ENC_PREFIX = 'enc:v1:'
const getAesKey = (): Promise<CryptoKey> => {
  const k = Deno.env.get('CUSTOMER_AES_KEY_V1') || ''
  const raw = fromBase64Url(k)
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'decrypt',
  ])
}

const decryptMaybe = async (
  v: string | null,
): Promise<{ ok: boolean; value: string | null }> => {
  if (!v) return Promise.resolve({ ok: true, value: null })
  if (!v.startsWith(ENC_PREFIX)) return Promise.resolve({ ok: true, value: v })

  const without = v.slice(ENC_PREFIX.length)
  const parts = without.split(':')
  const ivPart = parts.find((p) => p.startsWith('iv=')) || ''
  const ctPart = parts.find((p) => p.startsWith('ct=')) || ''
  const iv = fromBase64Url(ivPart.replace('iv=', ''))
  const ct = fromBase64Url(ctPart.replace('ct=', ''))
  return getAesKey()
    .then((key) =>
      crypto.subtle
        .decrypt({ name: 'AES-GCM', iv }, key, ct)
        .then((buf) => {
          const text = new TextDecoder().decode(new Uint8Array(buf))
          return { ok: true, value: text }
        })
        .catch(() => ({ ok: false, value: null })),
    )
    .catch(() => ({ ok: false, value: null }))
}

// 環境変数（Supabaseダッシュボードで設定）
// SUPABASE_URL はプラットフォームが自動注入（Secrets登録は不要）
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string
// Service Role: プラットフォームが SUPABASE_SERVICE_ROLE_KEY を注入
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
  'SUPABASE_SERVICE_ROLE_KEY',
) as string
// LINE アクセストークンも Secrets で管理
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get(
  'LINE_CHANNEL_ACCESS_TOKEN',
) as string

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 日付: "m月d日(曜)"
const formatDateWithWeekday = (dateStr: string) => {
  const date = new Date(dateStr)
  const w = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  return `${date.getMonth() + 1}月${date.getDate()}日(${w})`
}

// 時刻: "HH:MM"（分まで表示）
const formatHourOnly = (timeStr: string) => {
  const [h = '00', m = '00'] = (timeStr || '').split(':')
  const hour = String(h).padStart(2, '0')
  const minute = String(m).padStart(2, '0')
  return `${hour}:${minute}`
}

// リマインダー文面（雛形）
const createReminderMessage = (params: {
  type: '7days_before' | '1day_before'
  displayName: string
  store: string
  reservationDate: string
  reservationTime: string
  staffName: string
  menu: string
  staffOfficialLineUrl?: string | null
}) => {
  const {
    type,
    displayName,
    store,
    reservationDate,
    reservationTime,
    staffName,
    menu,
    staffOfficialLineUrl,
  } = params
  const dateText = `${formatDateWithWeekday(reservationDate)} ${formatHourOnly(reservationTime)}`

  // フッター生成ロジック
  const footer = (() => {
    // 担当者公式LINEリンクがある場合
    if (staffOfficialLineUrl) {
      return `\n\nご予約の変更などのご相談は担当スタッフ公式LINEまで⬇️\n${staffOfficialLineUrl}`
    }

    // 店舗電話番号フッター
    const storeEnvKeyMap: Record<string, string> = {
      大宮店: 'STORE_TEL_NUM_OMIYA',
      北浦和店: 'STORE_TEL_NUM_KITAURAWA',
    }
    const envKey = storeEnvKeyMap[store]
    const telNum = envKey ? Deno.env.get(envKey) : null

    if (telNum) {
      return `\n\nご予約の変更やキャンセルなどのご相談は、お電話にてご連絡ください\n℡${telNum}`
    }

    return ''
  })()

  if (type === '7days_before') {
    return `${displayName}様

ご予約1週間前となりました。
【予約内容】
店舗：${store}
日時：${dateText}
担当：${staffName}
メニュー：${menu}
お会いできるのを楽しみにしています。${footer}`
  }

  return `${displayName}様

ご予約前日となりました。ご来店を心よりお待ちしております。
【予約内容】
店舗：${store}
日時：${dateText}
担当：${staffName}
メニュー：${menu}
道中お気をつけてお越しくださいませ。${footer}`
}

const sendLineMessage = async (to: string, text: string) => {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`LINE push error: ${body}`)
  }
}

// JSTの日付(YYYY-MM-DD)を取得
const toJstYmd = (d: Date) => {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const y = jst.getUTCFullYear()
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(jst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const addDays = (ymd: string, days: number) => {
  const [y, m, d] = ymd.split('-').map((v) => Number(v))
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

const run = async () => {
  // 日次モード: JSTの今日から +1日 と +7日 を対象にする
  const jstToday = toJstYmd(new Date())
  const target1 = addDays(jstToday, 1)
  const target7 = addDays(jstToday, 7)

  // 対象予約を先に取得（confirmed かつ line_user_id あり）
  const { data: reservations, error: resErr } = await supabase
    .from('reservations')
    .select(
      'id, line_user_id, line_display_name, store, reservation_date, reservation_time, staff_id, staff_name_snapshot, menu, status',
    )
    .in('reservation_date', [target1, target7])
    .eq('status', 'confirmed')
    .not('line_user_id', 'is', null)

  if (resErr) return new Response(resErr.message, { status: 500 })
  if (!reservations || reservations.length === 0)
    return new Response('no-target-reservations')

  type ReservationRow = {
    id: string
    line_user_id: string
    line_display_name: string | null
    store: string
    reservation_date: string
    reservation_time: string
    staff_id: string | null
    staff_name_snapshot: string
    menu: string
    status: string
  }

  const mapById = new Map<string, ReservationRow>()
  const ids1: string[] = []
  const ids7: string[] = []
  for (const r of reservations) {
    mapById.set(r.id, r)
    if (r.reservation_date === target1) ids1.push(r.id)
    if (r.reservation_date === target7) ids7.push(r.id)
  }

  // 対象ジョブ（pending）のみ取得
  type Job = {
    id: string
    reservation_id: string
    remind_type: '1day_before' | '7days_before'
    status: 'pending' | 'sent' | 'failed' | 'cancelled'
    scheduled_at?: string
    sent_at?: string | null
    error_message?: string | null
  }
  const jobs: Job[] = []
  if (ids1.length > 0) {
    const { data: j1, error: j1err } = await supabase
      .from('reminder_jobs')
      .select('*')
      .eq('status', 'pending')
      .eq('remind_type', '1day_before')
      .in('reservation_id', ids1)
      .limit(500)
    if (j1err) return new Response(j1err.message, { status: 500 })
    if (j1) jobs.push(...j1)
  }
  if (ids7.length > 0) {
    const { data: j7, error: j7err } = await supabase
      .from('reminder_jobs')
      .select('*')
      .eq('status', 'pending')
      .eq('remind_type', '7days_before')
      .in('reservation_id', ids7)
      .limit(500)
    if (j7err) return new Response(j7err.message, { status: 500 })
    if (j7) jobs.push(...j7)
  }

  if (jobs.length === 0) return new Response('no-jobs')

  // 担当者IDから公式LINEリンクをまとめて解決
  const staffIds = Array.from(
    new Set(
      (reservations || [])
        .map((r: ReservationRow) => r.staff_id)
        .filter(Boolean),
    ),
  ) as string[]
  const staffUrlMap = new Map<string, string | null>()
  if (staffIds.length > 0) {
    const { data: staffRows } = await supabase
      .from('staff')
      .select('id, official_line_url, is_active')
      .in('id', staffIds)
      .eq('is_active', true)
    for (const s of staffRows || []) {
      // 型アサーションで文字列化してキー化
      staffUrlMap.set(
        String((s as { id: string }).id),
        (s as { official_line_url: string | null }).official_line_url || null,
      )
    }
  }

  for (const job of jobs) {
    const resv = mapById.get(job.reservation_id)
    if (!resv) continue

    const displayNameRes = await decryptMaybe(resv.line_display_name)
    const displayName =
      displayNameRes.ok && displayNameRes.value
        ? displayNameRes.value
        : 'お客様'

    const text = createReminderMessage({
      type: job.remind_type,
      displayName,
      store: resv.store,
      reservationDate: resv.reservation_date,
      reservationTime: resv.reservation_time,
      staffName: resv.staff_name_snapshot,
      menu: resv.menu,
      staffOfficialLineUrl: resv.staff_id
        ? staffUrlMap.get(resv.staff_id) || null
        : null,
    })

    const toRes = await decryptMaybe(resv.line_user_id)
    const toId = toRes.ok ? toRes.value || '' : ''

    await (toId
      ? sendLineMessage(toId, text)
      : Promise.reject(new Error('line_user_id decrypt failed'))
    )
      .then(async () => {
        await supabase
          .from('reminder_jobs')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            error_message: null,
          })
          .eq('id', job.id)
      })
      .catch(async (e) => {
        await supabase
          .from('reminder_jobs')
          .update({ status: 'failed', error_message: String(e?.message || e) })
          .eq('id', job.id)
      })
  }

  return new Response('ok')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST')
    return new Response('method not allowed', { status: 405 })
  return run()
})
