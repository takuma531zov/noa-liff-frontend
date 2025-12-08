# 美容室予約リマインダー自動送信システム 開発計画

## プロジェクト概要

スタッフがWebアプリから予約を登録し、LINEでお客様に同意リンクを送るだけで、Supabase上で予約情報を管理・自動リマインド送信を行うシステム。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) / React / TypeScript
- **バックエンド**: Supabase (PostgreSQL, Auth, Edge Functions, Scheduled Functions)
- **LINE連携**: LINE Messaging API / LINE LIFF
- **デプロイ**: Vercel (Frontend) / Supabase (Backend)
- **開発環境**: Node.js 20+, pnpm

## 開発の前提条件

- [ ] Supabaseプロジェクトを作成（後述の手順で実施）
- [ ] LINE公式アカウントのChannel Access Token取得済み
- [ ] LIFF appの作成（新仕様に合わせて再設定）
- [ ] Vercelアカウント準備済み

---

## Phase 1: MVP開発計画

### 1. 環境準備（1週目）

#### 1-1. リポジトリのクリーンアップ
- [ ] 既存のsrc/ディレクトリを削除
- [ ] 既存のindex.htmlを削除
- [ ] 既存のpackage.jsonを削除
- [ ] CLAUDE.md、supabase-reminder-design-doc.md、devPlan.mdを残す
- [ ] .gitignoreを更新

#### 1-2. Next.js環境構築
- [ ] Next.js 14プロジェクトをセットアップ（App Router）
- [ ] TypeScript設定
- [ ] Biome（リンター・フォーマッター）設定
- [ ] package.jsonの依存関係インストール
  - @supabase/supabase-js
  - @supabase/ssr
  - @line/liff
  - その他必要なパッケージ

#### 1-3. Supabase環境構築
- [ ] Supabaseプロジェクト作成（https://supabase.com/）
- [ ] プロジェクトURL、API Keyを取得
- [ ] Vercel環境変数に設定
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - LINE_CHANNEL_ACCESS_TOKEN
  - NEXT_PUBLIC_LIFF_ID（顧客同意LIFF用）

---

### 2. データベース設計・構築（1週目）

#### 2-1. テーブル設計（ミニマム構成）

**reservationsテーブル**
```sql
- id (uuid, primary key)
- store (text) -- 店舗名（大宮店/北浦和店）
- staff_id (uuid, nullable) -- 担当スタッフ参照（NULLは指名無し）
- staff_name_snapshot (text) -- 予約時点の担当者名スナップショット（指名無しを含む）
- menu (text) -- メニュー（自由入力テキスト）
- reservation_date (date) -- 予約日
- reservation_time (time) -- 予約時間（開始時間のみ）
- customer_name (text, nullable) -- 顧客名（本名、スタッフ入力、任意）
- line_display_name (text, nullable) -- LINE表示名（自動取得）
- line_user_id (text, nullable) -- LINE UserID（同意後に登録）
- consent (boolean, default: false) -- 同意フラグ
- consent_token (text, unique) -- JWT署名トークン（予約識別用）
- status (text) -- 予約ステータス（pending, confirmed, cancelled）
- created_at (timestamptz)
- updated_at (timestamptz)
```

**reminder_jobsテーブル**
```sql
- id (uuid, primary key)
- reservation_id (uuid, foreign key)
- remind_type (text) -- リマインド種別（7days_before, 1day_before）
- scheduled_at (timestamptz) -- 送信予定日時
- sent_at (timestamptz, nullable) -- 送信完了日時
- status (text) -- ジョブステータス（pending, sent, failed, cancelled）
- error_message (text, nullable) -- エラーメッセージ
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### 2-2. データベース構築
- [ ] Supabase SQL Editorで上記テーブルを作成
- [ ] インデックス設定（reservation_id, scheduled_at, status, line_user_id）
- [ ] RLS（Row Level Security）ポリシー設定（Phase 2で実装）

#### 2-3. トリガー関数作成
- [ ] 予約作成時に自動的にreminder_jobsを生成するトリガー関数
  - 1週間前のジョブ（remind_type: '7days_before'）
  - 前日のジョブ（remind_type: '1day_before'）
- [ ] 予約更新時に既存のreminder_jobsをキャンセル（status='cancelled'）し、新規ジョブを生成するトリガー関数
  - キャンセル済み予約（status='cancelled'）の場合は新規生成しない

---

### 3. スタッフ用Webアプリ開発（2週目）

#### 3-1. 基本レイアウト
- [ ] レスポンシブデザイン（モバイルファースト）
- [ ] ヘッダー・フッター
- [ ] ナビゲーション

#### 3-2. 予約登録フォーム（ミニマム構成）
- [ ] 店舗選択（大宮店/北浦和店 - ドロップダウン）
- [ ] 担当スタッフ選択（staff.id を value、指名無しは未選択）
- [ ] メニュー入力（テキスト自由入力）
- [ ] 予約日選択（date picker）
- [ ] 予約時間選択（time picker - 開始時間のみ）
- [ ] 顧客名入力（テキスト入力、任意）
- [ ] 電話番号入力（テキスト入力、任意）
- [ ] バリデーション実装
- [ ] 送信ボタン

#### 3-3. Supabase連携
- [ ] Supabaseクライアント初期化
- [ ] 予約登録API（Edge Function）作成
  - 予約データをreservationsテーブルに保存
  - consent_token生成（JWT署名）
  - 顧客同意LIFF URLを生成して返却
- [ ] フロントエンドから予約登録API呼び出し

#### 3-4. 同意リンク生成・表示
- [ ] 予約登録成功後、同意リンクを画面に表示
- [ ] コピーボタン実装
- [ ] QRコード表示（オプション）
- [ ] 説明文「このリンクをLINEでお客様に送信してください」

#### 3-5. 予約一覧・検索機能
- [ ] 予約一覧画面
  - 日付で絞り込み（デフォルト：今日以降）
  - 店舗で絞り込み（オプション）
  - ステータスで絞り込み（pending, confirmed, cancelled）
- [ ] 予約カード表示
  - 日時、店舗、スタッフ、メニュー
  - 顧客名（入力されていれば）
  - LINE表示名（同意後に表示）
  - ステータス
- [ ] 検索機能
  - 顧客名で検索（部分一致）
  - LINE表示名で検索（部分一致）
  - 日付範囲で検索

#### 3-6. 予約編集・キャンセル機能
- [ ] 予約詳細画面
  - 現在の予約情報を表示
  - 編集ボタン
  - キャンセルボタン
- [ ] 予約編集フォーム
  - 店舗、スタッフ、メニュー、日時、顧客名、電話番号を編集可能
  - 更新ボタン
- [ ] 予約キャンセル処理
  - 確認ダイアログ
  - statusを'cancelled'に更新
  - reminder_jobsをキャンセル（トリガー関数で自動処理）

---

### 4. 顧客同意LIFF開発（3週目）

#### 4-1. LIFF app設定
- [ ] LINE Developers Consoleで新しいLIFF appを作成
- [ ] Endpoint URL設定（Vercelデプロイ後のURL + /liff/consent）
- [ ] Scope設定（profile, openid）
- [ ] LIFF IDを環境変数に追加

#### 4-2. 顧客同意画面UI
- [ ] LIFF初期化処理
- [ ] トークン検証（consent_token）
- [ ] 予約情報表示（店舗、スタッフ、メニュー、日時）
- [ ] 同意確認チェックボックス
- [ ] 同意ボタン

#### 4-3. 顧客同意処理
- [ ] LIFFからlineUserIdとdisplayNameを取得
  - liff.getProfile() → displayName
  - liff.getContext().userId → lineUserId
- [ ] Edge Function経由でreservationsテーブルを更新
  - line_user_idを登録
  - line_display_nameを登録（自動取得）
  - consentをtrueに更新
  - statusを'confirmed'に更新
- [ ] 同意完了メッセージ表示
- [ ] LIFFウィンドウを閉じる

---

### 5. リマインダー自動送信機能（4週目）

#### 5-1. Scheduled Function作成
- [ ] Supabase Edge Functionで5分ごとに実行されるScheduled Functionを作成
- [ ] reminder_jobsテーブルから送信対象ジョブを取得
  - status = 'pending'
  - scheduled_at <= 現在時刻
  - 関連するreservationのstatusが'confirmed'
  - line_user_idが存在する

#### 5-2. LINE Messaging API連携
- [ ] LINE Messaging APIでプッシュメッセージ送信
  - 送信先: line_user_id
  - メッセージ内容（LINE表示名を使用）:
    - 1週間前: 「{line_display_name}様、来週の予約日が近づいております。◯月◯日◯時～、担当：◯◯、メニュー：◯◯でご予約いただいております。」
    - 前日: 「{line_display_name}様、明日◯時～ご予約いただいております。担当：◯◯、メニュー：◯◯。ご来店をお待ちしております。」
- [ ] 送信成功時にreminder_jobsを更新
  - status = 'sent'
  - sent_at = 現在時刻
- [ ] 送信失敗時の処理
  - status = 'failed'
  - error_messageに記録

#### 5-3. エラーハンドリング
- [ ] LINE API送信エラー時のリトライロジック（最大3回）
- [ ] エラーログをSupabaseに保存
- [ ] 管理者通知（オプション）

---

### 6. テスト・デプロイ（5週目）

#### 6-1. ローカルテスト
- [ ] スタッフ用Webアプリの動作確認
- [ ] 予約登録フロー確認
- [ ] 同意LIFF動作確認
- [ ] Scheduled Function手動実行でリマインダー送信テスト

#### 6-2. Vercelデプロイ
- [ ] Next.jsアプリをVercelにデプロイ
- [ ] 環境変数設定
- [ ] カスタムドメイン設定（オプション）

#### 6-3. Supabase Scheduled Function設定
- [ ] Scheduled Functionをcronで5分ごとに実行設定
- [ ] 本番環境での動作確認

#### 6-4. 統合テスト
- [ ] 予約登録 → 同意 → リマインダー送信までの全体フロー確認
- [ ] エラーケースのテスト（無効なトークン、同意なし、送信失敗など）

---

### 7. ドキュメント整備・引き継ぎ（6週目）

- [ ] README.mdの更新（環境構築手順、デプロイ手順）
- [ ] API仕様書作成
- [ ] Supabaseテーブル定義書作成
- [ ] 運用マニュアル作成（スタッフ向け）
- [ ] トラブルシューティングガイド

---

## システムフロー

### 新規予約フロー
```
1. スタッフがWebアプリで予約登録
   - 店舗、スタッフ、メニュー、日時を入力
   - 顧客名、電話番号を入力（任意）
   ↓
2. consent_token生成、予約リンクが表示される
   ↓
3. スタッフがLINEで顧客にリンクを送信
   ↓
4. 顧客がリンクをタップ（LIFF起動）
   ↓
5. 顧客が予約内容を確認して同意
   ↓
6. LINE表示名（displayName）とlineUserIdがDBに自動登録
   - line_display_name: 自動取得
   - line_user_id: 自動取得
   - status: 'confirmed'
   ↓
7. 自動的にリマインダージョブが生成される（トリガー）
   ↓
8. 予定日時にリマインダーが自動送信される
```

### 予約変更フロー
```
1. スタッフがWebアプリで予約一覧を表示
   - 日付で絞り込み
   - 顧客名 or LINE表示名で検索
   ↓
2. 該当の予約を選択
   ↓
3. 予約編集フォームで内容を変更
   - 店舗、スタッフ、メニュー、日時、顧客名、電話番号
   ↓
4. 更新ボタンを押す
   ↓
5. 既存のreminder_jobsがキャンセルされる（トリガー）
   ↓
6. 新しいreminder_jobsが生成される（トリガー）
   ↓
7. 変更後の日時にリマインダーが送信される
```

---

## Phase 2: 運用拡張（参考）

以下の機能は将来的に追加する場合の参考項目です：

- [ ] スタッフ認証（メールOTP）
- [ ] 文面テンプレート管理（DB化）
- [ ] 多店舗対応（store_id単位のRLS制御）
- [ ] 予約一覧・検索機能（スタッフWebアプリ）
- [ ] リマインダー送信履歴確認
- [ ] ダッシュボード（統計情報）
- [ ] アーカイブ・削除バッチ（30日超）
- [ ] 顧客からの予約変更リクエスト機能

---

## 開発上の注意事項

1. **CLAUDE.mdの開発ルールを厳守**
   - biomeエラー、tsエラーを放置しない
   - try-catchは禁止（エラーハンドリングは関数型で）
   - 関数型プログラミング
   - 1ファイル200行まで

2. **初心者向け配慮**
   - 各工程で何をするか必ず説明してから実装
   - 環境設定は1工程ずつ丁寧に案内
   - コードには日本語コメントを付ける

3. **不明点があれば必ず質問**
   - 実装前にユーザーの許可を得る
   - 設定ファイルやファイル削除は許可なしに行わない

---

## 次のステップ

1. 環境準備からスタート
2. 各工程の完了ごとにチェックを入れる
3. 不明点があればその都度質問して進める
