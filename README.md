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

# 管理ログイン（Cookieガード）
INTERNAL_BASIC_USER=your-internal-user
INTERNAL_BASIC_PASSWORD=your-internal-password
INTERNAL_AUTH_SECRET=your-long-random-secret
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

## フロント実装メモ

- モーダル（予約内容変更）は iOS Safari のスタッキングコンテキスト対策として React Portal（`document.body` 直下）で描画しています。
  - オーバーレイは `position: fixed` と `zIndex: 9999` を明示。
  - モバイル時は高さを `100dvh` にし、URLバーの表示/非表示に追従します（`vh` は未使用）。
  - スクロールは「入力フィールド領域」のみに限定し、`WebkitOverflowScrolling: 'touch'` と `overscrollBehavior: 'contain'` を付与。
  - フッターの「更新する」ボタンはスクロール領域の外に配置し、常時下部に表示（重なり回避のため、下端に `env(safe-area-inset-bottom)` を考慮）。
  - 実装箇所: `src/components/ReservationEditModal.tsx`

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
   - `supabase/sql/04_alter_reservations_staff_id_snapshot.sql`
     - reservations に `staff_id (uuid, nullable)` と `staff_name_snapshot (text not null default '指名無し')` を追加し、旧 `staff_name` を削除します。
   - `supabase/sql/05_create_reminder_jobs_and_triggers.sql`
     - `reminder_jobs` テーブルと、reservations 追加/更新時にジョブを生成・再生成するトリガーを作成します。
2. Edge Function をデプロイ（Supabase CLI またはダッシュボード）
   - ランタイム環境変数（Secrets）を設定:
     - `LINE_CHANNEL_ACCESS_TOKEN`: LINE チャネルアクセストークン（必須）
     - 備考: `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` はプラットフォームが自動注入されます（`SUPABASE_` で始まる名前は手動登録不可）。
3. スケジュール実行を設定（5分おき推奨）
   - Supabase ダッシュボード → Edge Functions → `reminder-runner` → Schedule

メッセージ文面（採用候補A）
- 予約確定（同意後）
  - {displayName}様
    ご予約が確定しました。
    【店舗】{store}
    【日時】{m月d日(曜) hh:mm}
    【担当】{staffName}
    【メニュー】{menu}
    ご来店を心よりお待ちしております。
- 予約変更通知
  - {displayName}様
    ご予約内容を下記のとおり変更しました。
    【変更後】
    店舗：{after.store}
    日時：{afterDate} {afterTime}
    担当：{after.staffName}
    メニュー：{after.menu}
    ご来店を心よりお待ちしております。
- リマインド（7日前）
  - {displayName}様
    ご予約1週間前となりました。
    【予約内容】
    店舗：{store}
    日時：{m月d日(曜) hh:mm}
    担当：{staffName}
    メニュー：{menu}
    お会いできるのを楽しみにしています。
- リマインド（前日）
  - {displayName}様
    ご予約前日となりました。ご来店を心よりお待ちしております。
    【予約内容】
    店舗：{store}
    日時：{m月d日(曜) hh:mm}
    担当：{staffName}
    メニュー：{menu}
    道中お気をつけてお越しくださいませ。
  - いずれも【店舗 / 日時 / 担当 / メニュー】を記載（文面は `supabase/functions/reminder-runner/index.ts` および `src/lib/line/messaging.ts` 内で編集可能）

補足
- 担当スタッフに「公式LINEリンク」が設定されている場合、送信メッセージ末尾に以下のフッターが自動追記されます（未設定時は追記なし）。
  - 「ご予約の変更などのご相談はこちらまで」
  - 「{担当者公式LINEリンクURL}」
  - 対象: リマインダー（Supabase Edge Function）および Next.js 側のプッシュ送信。
- 「担当：」の表示は予約作成時のスナップショット名（`reservations.staff_name_snapshot`）を使用します。リンク解決は `reservations.staff_id` 経由で最新の `staff.official_line_url` を参照します。

## セキュリティ・アクセス制御（管理UI/管理API）

- 管理UI（`/staff`, `/reservations`）と管理API（`/api/admin/*`）はCookieベース認証で保護されます。
  - ログイン: `/internal/login`
  - ログアウト: `/api/internal/logout`
  - 有効期限: デフォルト14日（`INTERNAL_AUTH_SECRET` で署名）
- RLS（Row Level Security）
  - `reservations`, `staff`, `reminder_jobs` は RLS 有効化済み（`supabase/sql/08_enable_rls_and_policies.sql`）。
  - 匿名ユーザー向けポリシーは未付与のため、直接のDBアクセスは拒否されます。
  - すべてのDB操作は Next.js API から Service Role で実行します。
- 公開API
  - 予約作成: `POST /api/reservations`
  - 同意フロー: `POST /api/consent/verify`, `POST /api/consent/confirm`
  - スタッフ最小一覧: `GET /api/public/staff`（`id,name,stores` のみ）
- データ最小化
  - APIの返却から `line_user_id` および `consent_token` は除外しています。
