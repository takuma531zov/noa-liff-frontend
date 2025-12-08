## create_reminder_jobs

BEGIN
    -- 1週間前のリマインダージョブ
    INSERT INTO public.reminder_jobs (
      reservation_id,
      remind_type,
      scheduled_at,
      status
    ) VALUES (
      NEW.id,
      '7days_before',
      (NEW.reservation_date - INTERVAL '7 days')::DATE + NEW.reservation_time::TIME,
      'pending'
    );

    -- 前日のリマインダージョブ
    INSERT INTO public.reminder_jobs (
      reservation_id,
      remind_type,
      scheduled_at,
      status
    ) VALUES (
      NEW.id,
      '1day_before',
      (NEW.reservation_date - INTERVAL '1 day')::DATE + NEW.reservation_time::TIME,
      'pending'
    );

    RETURN NEW;
  END;

## update_reminder_jobs
  BEGIN
    -- 日時が変更された場合のみ実行
    IF OLD.reservation_date != NEW.reservation_date OR OLD.reservation_time != NEW.reservation_time THEN
      -- 既存のpendingジョブをキャンセル
      UPDATE public.reminder_jobs
      SET status = 'cancelled'
      WHERE reservation_id = NEW.id
        AND status = 'pending';

      -- 新しいリマインダージョブを作成
      -- 1週間前
      INSERT INTO public.reminder_jobs (
        reservation_id,
        remind_type,
        scheduled_at,
        status
      ) VALUES (
        NEW.id,
        '7days_before',
        (NEW.reservation_date - INTERVAL '7 days')::DATE + NEW.reservation_time::TIME,
        'pending'
      );

      -- 前日
      INSERT INTO public.reminder_jobs (
        reservation_id,
        remind_type,
        scheduled_at,
        status
      ) VALUES (
        NEW.id,
        '1day_before',
        (NEW.reservation_date - INTERVAL '1 day')::DATE + NEW.reservation_time::TIME,
        'pending'
      );
    END IF;

    RETURN NEW;
  END;

## update_updated_at_column
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;


