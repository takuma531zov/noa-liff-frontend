-- staff テーブルに担当者公式LINEリンク列を追加（NULL可）
-- 既存環境に対しても安全に再実行可能なよう IF NOT EXISTS を付与
ALTER TABLE IF EXISTS staff
  ADD COLUMN IF NOT EXISTS official_line_url text;

-- 参照のための簡易インデックス（スタッフ名一意前提）
-- 既に同名インデックスがある場合はエラーにならないよう存在チェック
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_staff_name' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_staff_name ON staff (name);
  END IF;
END $$;

