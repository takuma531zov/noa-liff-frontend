# Noa LIFF Frontend

美容室Noaの予約システム - LINE LIFF フロントエンド

## 構成

- `index.html` - LIFF予約フォーム
- `vercel.json` - Vercel設定

## デプロイ

```bash
vercel
```

## 環境変数

HTMLファイル内で直接設定：
- `LIFF_ID` - LINE LIFF アプリID
- `GAS_BASE_URL` - Google Apps Script API エンドポイント

## バックエンド

GASバックエンドは別リポジトリ `gas-odyssey-master/packages/noaLineReminder` で管理
