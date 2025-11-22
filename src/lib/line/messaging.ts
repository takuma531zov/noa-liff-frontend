// LINE Messaging API ユーティリティ

// メッセージ送信型
type SendMessageParams = {
  to: string
  messages: Array<{
    type: 'text'
    text: string
  }>
}

// LINE Messaging APIでプッシュメッセージを送信
export const sendLineMessage = async (params: SendMessageParams) => {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

  if (!channelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN が設定されていません')
  }

  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`LINE メッセージ送信エラー: ${errorData}`)
  }

  return response.json()
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

  // 日付フォーマット
  const date = new Date(reservationDate)
  const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  const formattedTime = reservationTime.slice(0, 5)

  return `${displayName}様

ご予約の同意ありがとうございます。

【予約内容】
店舗：${store}
日時：${formattedDate} ${formattedTime}～
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

  // 日付フォーマット関数
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  const beforeDate = formatDate(before.reservationDate)
  const afterDate = formatDate(after.reservationDate)
  const beforeTime = before.reservationTime.slice(0, 5)
  const afterTime = after.reservationTime.slice(0, 5)

  // 差分が分かるように変更前→変更後を併記
  return `${displayName}様

ご予約内容の変更をお知らせします。

【変更前】
店舗：${before.store}
日時：${beforeDate} ${beforeTime}～
担当：${before.staffName}
メニュー：${before.menu}

【変更後】
店舗：${after.store}
日時：${afterDate} ${afterTime}～
担当：${after.staffName}
メニュー：${after.menu}

ご確認をお願いいたします。`
}
