# 美容室予約リマインダー自動送信システム

美容室Noaの予約管理・自動リマインド送信システム

## システム概要

スタッフがWebアプリから予約を登録し、LINEでお客様に同意リンクを送るだけで、Supabase上で予約情報を管理・自動リマインド送信を行うシステムです。

### 主な機能

- **スタッフ用Webアプリ**: 予約登録・一覧・検索・編集
- **顧客用LIFF画面**: 予約内容確認・同意（LINE表示名を自動取得）
- **自動リマインダー送信**: 予約日の1週間前・前日に自動送信

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) / React / TypeScript
- **バックエンド**: Supabase (PostgreSQL, Edge Functions, Scheduled Functions)
- **LINE連携**: LINE Messaging API / LINE LIFF
- **デプロイ**: Vercel

## 環境変数

```.env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LINE
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
NEXT_PUBLIC_LIFF_ID=your-liff-id
```

## 開発

```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# 型チェック
pnpm typecheck

# Lint & Format
pnpm lint
```

## デプロイ

```bash
vercel
```

## ドキュメント

- [開発計画](./devPlan.md) - 開発フェーズと進捗管理
- [設計書](./supabase-reminder-design-doc.md) - システム設計概要
- [開発ルール](./CLAUDE.md) - コーディング規約
