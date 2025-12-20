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
    ? `\n\nご予約の変更などのご相談は担当スタッフ公式LINEまで⬇️\n${params.staffOfficialLineUrl}`
    : ''

  const messages =
    footer && params.messages.length > 0 && params.messages[0]?.type === 'text'
      ? [
          {
            type: 'text',
            text: `${params.messages[0].text}${footer}` as const,
          },
          ...params.messages.slice(1),
        ]
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

// 時刻を "HH:MM" にフォーマット（分まで表示）
const formatHourOnly = (timeStr: string) => {
  const [h = '00', m = '00'] = (timeStr || '').split(':')
  const hour = String(h).padStart(2, '0')
  const minute = String(m).padStart(2, '0')
  return `${hour}:${minute}`
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

  // 表示用日付・時刻
  const formattedDate = formatDateWithWeekday(reservationDate)
  const formattedTime = formatHourOnly(reservationTime)
  const dateText = `${formattedDate} ${formattedTime}`

  return `${displayName}様

ご予約が確定しました。
【店舗】${store}
【日時】${dateText}
【担当】${staffName}
【メニュー】${menu}
ご来店を心よりお待ちしております。`
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

  // 採用候補A: 変更後のみ案内（温かみ）
  return `${displayName}様

ご予約内容を下記のとおり変更しました。
【変更後】
店舗：${after.store}
日時：${afterDate} ${afterTime}
担当：${after.staffName}
メニュー：${after.menu}
ご来店を心よりお待ちしております。`
}
