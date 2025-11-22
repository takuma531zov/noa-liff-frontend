# 美容室予約リマインダー自動送信システム

美容室Noaの予約管理・自動リマインド送信システム

## システム概要

スタッフがWebアプリから予約を登録し、LINEでお客様に同意リンクを送るだけで、Supabase上で予約情報を管理・自動リマインド送信を行うシステムです。

### 主な機能

- **スタッフ用Webアプリ**: 予約登録・一覧・検索・編集
- **顧客用LIFF画面**: 予約内容確認・同意（LINE表示名を自動取得）
- **自動リマインダー送信**: 予約日の1週間前・前日に自動送信
- **予約変更通知**: スタッフが予約を更新したタイミングでLINEに変更内容を通知（再同意は不要）

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

## Supabase リマインダー雛形

本リポジトリには、Supabase 側で動作する自動リマインダー送信の雛形を同梱しています。

- SQL: `supabase/sql/01_create_reminder_jobs.sql`, `supabase/sql/02_triggers_reservations.sql`
  - `reminder_jobs` テーブルを作成
  - 予約の作成/更新時に、7日前・前日のジョブを自動生成（更新時は既存ジョブをcancelledに）
  - 補足: 作成済みのテーブルに再実行しても安全な idempotent な作り
- Edge Function: `supabase/functions/reminder-runner/`
  - 期限到来の `pending` ジョブを取得し、LINEにプッシュ送信
  - 送信成功で `sent/sent_at`、失敗で `failed/error_message` を更新
  - 予約が未同意/line_user_idなしの場合は `cancelled`

設定手順（概要）
1. Supabase SQL Editor で SQL を順に実行（既に実装済みなら不要）
2. Edge Function をデプロイ（Supabase CLI またはダッシュボード）
   - ランタイム環境変数（Secrets）を設定:
     - `LINE_CHANNEL_ACCESS_TOKEN`: LINE チャネルアクセストークン（必須）
     - 備考: `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` はプラットフォームが自動注入されます（`SUPABASE_` で始まる名前は手動登録不可）。
3. スケジュール実行を設定（5分おき推奨）
   - Supabase ダッシュボード → Edge Functions → `reminder-runner` → Schedule

メッセージ文面（雛形）
- 7日前: 「{displayName}様、来週のご予約日が近づいております。日時：m月d日(曜) hh:00」
- 前日: 「{displayName}様、明日のご予約のご案内です。日時：m月d日(曜) hh:00」
  - いずれも【店舗 / 日時 / 担当 / メニュー】を記載（文面は `supabase/functions/reminder-runner/index.ts` 内で編集可能）
