import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Noa次回予約通知',
  description: '美容室Noaの予約管理・自動リマインド送信システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
