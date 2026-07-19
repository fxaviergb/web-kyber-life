-- Relays new `notifications` rows to /api/webhooks/notifications, which
-- sends the actual Web Push message. A DB trigger cannot call an external
-- HTTP endpoint directly, so this uses pg_net (via the same mechanism the
-- Supabase Dashboard's "Database Webhooks" UI sets up) to bridge the two.
--
-- Points at the production deployment (https://kyberlife-td.vercel.app).
-- Requires NOTIFICATIONS_WEBHOOK_SECRET, VAPID_PRIVATE_KEY,
-- NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_SUBJECT and SUPABASE_SERVICE_ROLE_KEY
-- to be set in that deployment's environment (see .env.example) — until
-- then the webhook fires but the route rejects it with 401/501.
--
-- SECURITY NOTE: this file is a template, not the live definition. The
-- real x-webhook-secret value is only stored in the deployed function on
-- Supabase (applied via mcp__Supabase__apply_migration) and in each
-- environment's NOTIFICATIONS_WEBHOOK_SECRET — never commit the actual
-- secret here. Replace YOUR_WEBHOOK_SECRET below before re-running this
-- file manually.

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION notify_push_webhook()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://kyberlife-td.vercel.app/api/webhooks/notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webhook-secret', 'YOUR_WEBHOOK_SECRET'
        ),
        body := jsonb_build_object('type', 'INSERT', 'table', 'notifications', 'record', to_jsonb(NEW))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_push_webhook
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION notify_push_webhook();
