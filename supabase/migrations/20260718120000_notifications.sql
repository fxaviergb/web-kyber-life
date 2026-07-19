-- In-app notification center: notifications table + per-device Web Push
-- subscriptions, populated by a trigger on financial_scanner_executions so
-- notifications are created regardless of whether the row was written by
-- this app or by the external n8n scanner webhook.

CREATE TYPE notification_type AS ENUM ('SCAN_COMPLETED', 'SCAN_FAILED');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_notifications_owner_created ON notifications(owner_user_id, created_at DESC);
CREATE INDEX idx_notifications_owner_unread ON notifications(owner_user_id) WHERE is_read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- No INSERT policy: rows are only ever created by the SECURITY DEFINER
-- trigger function below, which bypasses RLS. Users can only read/update
-- (mark as read) their own notifications, never fabricate new ones.
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = owner_user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Per-device Web Push subscriptions (browser PushManager registrations).
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_push_subscriptions_owner ON push_subscriptions(owner_user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push_subscriptions" ON push_subscriptions FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can insert own push_subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update own push_subscriptions" ON push_subscriptions FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete own push_subscriptions" ON push_subscriptions FOR DELETE USING (auth.uid() = owner_user_id);

-- financial_scanner_executions.owner_user_id is TEXT (written by the n8n
-- webhook, not this app) and occasionally holds test/garbage values
-- ("test", NULL, malformed UUIDs) — the exception handler + auth.users
-- existence check make the trigger a safe no-op for those rows instead of
-- aborting the scanner's own write.
CREATE OR REPLACE FUNCTION notify_on_scanner_execution_change()
RETURNS TRIGGER AS $$
DECLARE
    v_owner UUID;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status NOT IN ('COMPLETED', 'FAILED') THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'COMPLETED' AND COALESCE(NEW.total_transactions, 0) <= 0 THEN
        RETURN NEW;
    END IF;

    BEGIN
        v_owner := NEW.owner_user_id::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
        RETURN NEW;
    END;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_owner) THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'COMPLETED' THEN
        INSERT INTO notifications (owner_user_id, type, title, message, entity_type, entity_id)
        VALUES (
            v_owner,
            'SCAN_COMPLETED',
            'Nuevo escaneo completado',
            format('Se %s %s transacción(es) nueva(s)', CASE WHEN NEW.total_transactions = 1 THEN 'detectó' ELSE 'detectaron' END, NEW.total_transactions),
            'scan_execution',
            NEW.id
        );
    ELSE
        INSERT INTO notifications (owner_user_id, type, title, message, entity_type, entity_id)
        VALUES (
            v_owner,
            'SCAN_FAILED',
            'El escaneo falló',
            COALESCE(NEW.error_message, 'Ocurrió un error durante el escaneo de correos.'),
            'scan_execution',
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_on_scanner_execution_change
AFTER INSERT OR UPDATE OF status ON financial_scanner_executions
FOR EACH ROW
EXECUTE FUNCTION notify_on_scanner_execution_change();
