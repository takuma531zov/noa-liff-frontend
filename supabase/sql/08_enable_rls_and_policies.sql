-- RLS有効化と匿名拒否（ポリシー未付与）
-- 運用方針: すべてのDB操作はService Role経由（API）で実施

BEGIN;

ALTER TABLE IF EXISTS reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reminder_jobs ENABLE ROW LEVEL SECURITY;

-- 匿名(public)向けの許可ポリシーは作成しない
-- （必要に応じて今後JWTクレーム等で拡張）

COMMIT;

