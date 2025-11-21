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
