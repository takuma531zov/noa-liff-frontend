-- reminder_jobs テーブルと、reservations からの自動生成トリガー

BEGIN;

-- テーブル作成
CREATE TABLE IF NOT EXISTS reminder_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  remind_type text NOT NULL CHECK (remind_type IN ('7days_before', '1day_before')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 重複防止（pending のみ一意）
CREATE UNIQUE INDEX IF NOT EXISTS ux_reminder_jobs_unique_pending
  ON reminder_jobs (reservation_id, remind_type)
  WHERE status = 'pending';

-- よく使う検索向けインデックス
CREATE INDEX IF NOT EXISTS idx_reminder_jobs_reservation_id ON reminder_jobs (reservation_id);
CREATE INDEX IF NOT EXISTS idx_reminder_jobs_status ON reminder_jobs (status);
CREATE INDEX IF NOT EXISTS idx_reminder_jobs_scheduled_at ON reminder_jobs (scheduled_at);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION set_timestamp() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reminder_jobs_set_timestamp ON reminder_jobs;
CREATE TRIGGER trg_reminder_jobs_set_timestamp
  BEFORE UPDATE ON reminder_jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp();

-- reservations 変更時に reminder_jobs を再生成
CREATE OR REPLACE FUNCTION fn_refresh_reminder_jobs() RETURNS trigger AS $$
DECLARE
  d date := NEW.reservation_date;
BEGIN
  -- 既存 pending を cancel
  UPDATE reminder_jobs
    SET status = 'cancelled'
  WHERE reservation_id = NEW.id AND status = 'pending';

  -- キャンセルされた予約には新規生成しない
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- 7日前ジョブ
  INSERT INTO reminder_jobs (reservation_id, remind_type, scheduled_at, status)
  VALUES (NEW.id, '7days_before', (d - INTERVAL '7 days'), 'pending')
  ON CONFLICT DO NOTHING;

  -- 前日ジョブ
  INSERT INTO reminder_jobs (reservation_id, remind_type, scheduled_at, status)
  VALUES (NEW.id, '1day_before', (d - INTERVAL '1 day'), 'pending')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- トリガー（INSERT/UPDATE 共に実行）
DROP TRIGGER IF EXISTS trg_reservations_refresh_jobs ON reservations;
CREATE TRIGGER trg_reservations_refresh_jobs
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION fn_refresh_reminder_jobs();

COMMIT;
