-- 既存の予約に対して、7日前/前日の pending ジョブを不足分だけ生成する
-- 条件: confirmed かつ line_user_id がある予約のみ対象

INSERT INTO reminder_jobs (reservation_id, remind_type, scheduled_at, status)
SELECT r.id, '7days_before', (r.reservation_date - INTERVAL '7 days'), 'pending'
FROM reservations r
WHERE r.status = 'confirmed'
  AND r.line_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM reminder_jobs j
    WHERE j.reservation_id = r.id AND j.remind_type = '7days_before' AND j.status = 'pending'
  );

INSERT INTO reminder_jobs (reservation_id, remind_type, scheduled_at, status)
SELECT r.id, '1day_before', (r.reservation_date - INTERVAL '1 day'), 'pending'
FROM reservations r
WHERE r.status = 'confirmed'
  AND r.line_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM reminder_jobs j
    WHERE j.reservation_id = r.id AND j.remind_type = '1day_before' AND j.status = 'pending'
  );

