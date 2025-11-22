// @ts-nocheck
// Supabase Edge Function 雛形: 期限到来のリマインダーを送信
// - 5分おきのスケジュールで実行想定
// - reservations.status = 'confirmed' かつ line_user_id があるもののみ送信

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 環境変数（Supabaseダッシュボードで設定）
// SUPABASE_URL はプラットフォームが自動注入（Secrets登録は不要）
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string
// Service Role: プラットフォームが SUPABASE_SERVICE_ROLE_KEY を注入
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
// LINE アクセストークンも Secrets で管理
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') as string

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 日付: "m月d日(曜)"
const formatDateWithWeekday = (dateStr: string) => {
  const date = new Date(dateStr)
  const w = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  return `${date.getMonth() + 1}月${date.getDate()}日(${w})`
}

// 時刻: "HH:00"（分は00固定）
const formatHourOnly = (timeStr: string) => {
  const hour = (timeStr || '').split(':')[0]?.padStart(2, '0') || '00'
  return `${hour}:00`
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
}) => {
  const { type, displayName, store, reservationDate, reservationTime, staffName, menu } = params
  const dateText = `${formatDateWithWeekday(reservationDate)} ${formatHourOnly(reservationTime)}`

  if (type === '7days_before') {
    return `${displayName}様

来週のご予約日が近づいております。

【予約内容】
店舗：${store}
日時：${dateText}
担当：${staffName}
メニュー：${menu}

ご来店をお待ちしております。`
  }

  return `${displayName}様

明日のご予約のご案内です。

【予約内容】
店舗：${store}
日時：${dateText}
担当：${staffName}
メニュー：${menu}

ご来店をお待ちしております。`
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

const run = async () => {
  // 期限到来のpendingジョブを取得（バッチサイズを小さく）
  const nowIso = new Date().toISOString()
  const { data: jobs, error: jobsError } = await supabase
    .from('reminder_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(50)

  if (jobsError) return new Response(jobsError.message, { status: 500 })
  if (!jobs || jobs.length === 0) return new Response('no-jobs')

  for (const job of jobs) {
    // 関連予約を取得
    const { data: resv } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', job.reservation_id)
      .single()

    if (!resv || resv.status !== 'confirmed' || !resv.line_user_id) {
      // 条件を満たさない場合はスキップ
      await supabase
        .from('reminder_jobs')
        .update({ status: 'cancelled' })
        .eq('id', job.id)
      continue
    }

    const text = createReminderMessage({
      type: job.remind_type,
      displayName: resv.line_display_name || 'お客様',
      store: resv.store,
      reservationDate: resv.reservation_date,
      reservationTime: resv.reservation_time,
      staffName: resv.staff_name,
      menu: resv.menu,
    })

    await sendLineMessage(resv.line_user_id, text)
      .then(async () => {
        await supabase
          .from('reminder_jobs')
          .update({ status: 'sent', sent_at: new Date().toISOString(), error_message: null })
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
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })
  return run()
})
