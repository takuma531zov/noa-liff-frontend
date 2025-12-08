-- reminder_jobs の pending 重複を防ぐ部分ユニークインデックス
-- 既に存在する場合は何もしません

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS ux_reminder_jobs_unique_pending
  ON reminder_jobs (reservation_id, remind_type)
  WHERE status = 'pending';

COMMIT;

