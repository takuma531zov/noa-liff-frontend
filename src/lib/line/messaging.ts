// LINE Messaging API ユーティリティ

// メッセージ送信型
// 送信パラメータ（担当者公式LINEリンクは任意で指定）
type SendMessageParams = {
  to: string
  messages: Array<{
    type: 'text'
    text: string
  }>
  staffOfficialLineUrl?: string | null
}

// LINE Messaging APIでプッシュメッセージを送信
export const sendLineMessage = async (params: SendMessageParams) => {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

  if (!channelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN が設定されていません')
  }

  // 担当者公式LINEリンクのフッターを1通あたり最初のテキストメッセージだけに付与
  const footer = params.staffOfficialLineUrl
    ? `\n\nご予約の変更などのご相談はこちらまで\n${params.staffOfficialLineUrl}`
    : ''

  const messages =
    footer && params.messages.length > 0 && params.messages[0]?.type === 'text'
      ? [{ type: 'text', text: `${params.messages[0].text}${footer}` as const }, ...params.messages.slice(1)]
      : params.messages

  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({ to: params.to, messages }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`LINE メッセージ送信エラー: ${errorData}`)
  }

  return response.json()
}

// 日付を "M月D日(曜)" にフォーマット
const formatDateWithWeekday = (dateStr: string) => {
  const date = new Date(dateStr)
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  const w = weekdays[date.getDay()]
  return `${date.getMonth() + 1}月${date.getDate()}日(${w})`
}

// 時刻を "HH:00" にフォーマット（分は常に00で表示）
const formatHourOnly = (timeStr: string) => {
  const hour = (timeStr || '').split(':')[0]?.padStart(2, '0') || '00'
  return `${hour}:00`
}

// 予約確認メッセージを生成
export const createReservationConfirmMessage = (params: {
  displayName: string
  store: string
  reservationDate: string
  reservationTime: string
  staffName: string
  menu: string
}) => {
  const {
    displayName,
    store,
    reservationDate,
    reservationTime,
    staffName,
    menu,
  } = params

  // 指定のフォーマットに統一
  const formattedDate = formatDateWithWeekday(reservationDate)
  const formattedTime = formatHourOnly(reservationTime)

  return `${displayName}様

ご予約の同意ありがとうございます。

【予約内容】
店舗：${store}
日時：${formattedDate} ${formattedTime}
担当：${staffName}
メニュー：${menu}

予約日の1週間前と前日にリマインダーをお送りいたします。
ご来店をお待ちしております。`
}

// 予約変更通知メッセージを生成
export const createReservationChangeMessage = (params: {
  displayName: string
  before: {
    store: string
    reservationDate: string
    reservationTime: string
    staffName: string
    menu: string
  }
  after: {
    store: string
    reservationDate: string
    reservationTime: string
    staffName: string
    menu: string
  }
}) => {
  const { displayName, before, after } = params

  const beforeDate = formatDateWithWeekday(before.reservationDate)
  const afterDate = formatDateWithWeekday(after.reservationDate)
  const beforeTime = formatHourOnly(before.reservationTime)
  const afterTime = formatHourOnly(after.reservationTime)

  // 差分が分かるように変更前→変更後を併記
  return `${displayName}様

ご予約内容の変更をお知らせします。

【変更前】
店舗：${before.store}
日時：${beforeDate} ${beforeTime}
担当：${before.staffName}
メニュー：${before.menu}

【変更後】
店舗：${after.store}
日時：${afterDate} ${afterTime}
担当：${after.staffName}
メニュー：${after.menu}

ご確認をお願いいたします。`
}
