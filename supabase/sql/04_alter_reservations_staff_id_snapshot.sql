-- reservations テーブルを staff_id 参照＋スナップショット方式へ移行
-- 前提: staff(id uuid, name text, is_active boolean, ...) が存在

BEGIN;

-- 1) 列追加（存在しない場合のみ）
ALTER TABLE IF EXISTS reservations
  ADD COLUMN IF NOT EXISTS staff_id uuid NULL REFERENCES staff(id),
  ADD COLUMN IF NOT EXISTS staff_name_snapshot text;

-- 2) 既存データのバックフィル（本番未運用前提だが安全のため実施）
--   2-1) staff_name から staff_id を解決（同名一意前提）
UPDATE reservations r
SET staff_id = s.id
FROM staff s
WHERE r.staff_id IS NULL
  AND s.is_active = true
  AND s.name = r.staff_name;

--   2-2) スナップショット名の設定（staff_name を優先、なければ '指名無し'）
UPDATE reservations r
SET staff_name_snapshot = COALESCE(NULLIF(r.staff_name, ''), '指名無し')
WHERE r.staff_name_snapshot IS NULL;

-- 3) NOT NULL 制約とデフォルト（NULL を許容しつつスナップショットは必須）
ALTER TABLE reservations
  ALTER COLUMN staff_name_snapshot SET NOT NULL,
  ALTER COLUMN staff_name_snapshot SET DEFAULT '指名無し';

-- 4) インデックス（検索・JOIN用途）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_reservations_staff_id' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_reservations_staff_id ON reservations (staff_id);
  END IF;
END $$;

-- 5) 旧列の削除（存在する場合のみ）
ALTER TABLE IF EXISTS reservations
  DROP COLUMN IF EXISTS staff_name;

COMMIT;

