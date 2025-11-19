# 設計書（Design Doc）

## 1. 概要

* **プロジェクト名**：美容室予約リマインダー自動送信システム（Supabase版）
* **要約（1〜3行）**：
  スタッフがWebアプリから予約を登録し、LINEでお客様に同意リンクを送るだけで、Supabase上で予約情報を管理・自動リマインド送信を行うシステム。
  データはPostgreSQLベースで管理し、Edge FunctionsとScheduled Functionsにより安定的にリマインド処理を実現する。

---

## 2. 背景と課題

### なぜ必要か
* 従来、各スタッフが個別LINEでお客様に手動でリマインドを送っていたため、送信漏れ・タイミングのばらつきが発生していた。
* 店舗として一貫したタイミング・文面でリマインドを行いたいが、個人LINE運用のままでは自動化が不可能だった。

### 解決したい問題
* LINE公式アカウントを用いて、予約日の1週間前・前日に自動リマインドを送信できる仕組みを構築する。
* スタッフの入れ替えがあってもアカウント管理の手間が増えないよう、**メールOTP認証＋Webアプリ運用**に統一する。

---

## 3. ゴールと成功基準

### ゴール
* Supabaseを基盤とし、予約情報・顧客同意情報・リマインドジョブを一元管理する。
* Edge FunctionsとScheduled Functionsでリマインド送信を自動化し、スタッフの作業負荷を最小化する。

### 成功基準
* スタッフがWebフォームから予約を登録し、リンクを送るだけで自動通知が完結する。
* リマインド送信漏れ率 0%。
* お客様からの同意完了率 90%以上を維持。

### 計測指標（あれば）
* 月間自動送信件数／総予約件数（自動化率）
* リマインド送信エラー率（<1%）
* 平均API応答速度（p95 < 300ms）

---

## 4. 技術方針

### 採用技術
* **Supabase**（PostgreSQL, Auth, Edge Functions, Storage）
* **Next.js / React**（スタッフ用Webフロント）
* **LINE Messaging API**（リマインド配信）
* **LINE LIFF**（顧客同意画面）
* **JWT署名トークン**（予約識別・セキュリティ）

### システム構成
```
[スタッフWebアプリ]
   ↓ 予約登録API（Supabase REST）
[Supabase DB（reservations, reminder_jobs）]
   ↓ ジョブ生成トリガー
[Supabase Scheduled Function（5分ごと）]
   ↓ LINE Messaging API
[公式LINEアカウント] → リマインド送信
[顧客LIFF] → 同意＋lineUserId登録
```

### 主な連携先
| システム | 用途 | 連携方式 |
|-----------|------|-----------|
| Supabase | データベース・認証・スケジュール実行 | REST / SQL / Edge Function |
| LINE Messaging API | リマインド配信 | HTTPS (Bearer Token) |
| LINE LIFF | 顧客同意／userId取得 | OAuth / JS SDK |

---

## 5. 実装概要

### フェーズ分け
* **Phase 1**：MVP構築
　- 予約登録フォーム（Web）
　- 顧客LIFF（同意）
　- Supabaseスキーマ構築（reservations / reminder_jobs）
　- ジョブ生成トリガー
　- Scheduled Functionで前日・1週間前通知

* **Phase 2**：運用拡張
　- スタッフ認証（メールOTP）
　- 文面テンプレート管理（DB化）
　- 多店舗対応（store_id単位のRLS制御）
　- アーカイブ・削除バッチ（30日超）

### スケジュール目安
* 開発期間：約6週間
* リリース予定：2026年1月中旬

---

開発者はReact,Next.js,supabase初心者
必ず何をするか説明して理解を得てから実装すること。

環境設定等ユーザー側の操作が必要な場合は、1工程ずつ丁寧に案内して置いてきぼりならないようにしてください。
