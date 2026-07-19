-- Also create/refresh the scan-summary notification when a new row lands
-- in financial_scanner_transactions, as a more reliable backup to the
-- financial_scanner_executions COMPLETED/FAILED trigger: if an execution
-- ever gets stuck in PROCESSING (crashes, times out) after some
-- transactions were already written, the user still gets notified instead
-- of silently missing them.
--
-- Both triggers write to the SAME notification row (keyed by
-- entity_type/entity_id), upserting via the partial unique index below —
-- whichever fires first creates it, the other just refreshes the count/
-- status, so a single scan never produces duplicate notifications.

CREATE UNIQUE INDEX idx_notifications_entity_unique ON notifications(entity_type, entity_id) WHERE entity_id IS NOT NULL;

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
        )
        ON CONFLICT (entity_type, entity_id) WHERE entity_id IS NOT NULL
        DO UPDATE SET type = EXCLUDED.type, title = EXCLUDED.title, message = EXCLUDED.message, is_read = FALSE, read_at = NULL;
    ELSE
        INSERT INTO notifications (owner_user_id, type, title, message, entity_type, entity_id)
        VALUES (
            v_owner,
            'SCAN_FAILED',
            'El escaneo falló',
            COALESCE(NEW.error_message, 'Ocurrió un error durante el escaneo de correos.'),
            'scan_execution',
            NEW.id
        )
        ON CONFLICT (entity_type, entity_id) WHERE entity_id IS NOT NULL
        DO UPDATE SET type = EXCLUDED.type, title = EXCLUDED.title, message = EXCLUDED.message, is_read = FALSE, read_at = NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION notify_on_scanner_transaction_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_owner UUID;
    v_exec_uuid UUID;
    v_tx_count INT;
BEGIN
    IF NEW.execution_id IS NULL THEN
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

    -- financial_scanner_transactions.execution_id is the scanner's own text
    -- run id (e.g. "LOCAL_..."), which matches
    -- financial_scanner_executions.execution_id — NOT its uuid primary key.
    -- The uuid id is what notifications.entity_id points to.
    SELECT id INTO v_exec_uuid
    FROM financial_scanner_executions
    WHERE execution_id = NEW.execution_id
    LIMIT 1;

    IF v_exec_uuid IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT count(*) INTO v_tx_count
    FROM financial_scanner_transactions
    WHERE execution_id = NEW.execution_id;

    INSERT INTO notifications (owner_user_id, type, title, message, entity_type, entity_id)
    VALUES (
        v_owner,
        'SCAN_COMPLETED',
        'Nuevo escaneo completado',
        format('Se %s %s transacción(es) nueva(s)', CASE WHEN v_tx_count = 1 THEN 'detectó' ELSE 'detectaron' END, v_tx_count),
        'scan_execution',
        v_exec_uuid
    )
    ON CONFLICT (entity_type, entity_id) WHERE entity_id IS NOT NULL
    DO UPDATE SET type = EXCLUDED.type, title = EXCLUDED.title, message = EXCLUDED.message, is_read = FALSE, read_at = NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_on_scanner_transaction_insert
AFTER INSERT ON financial_scanner_transactions
FOR EACH ROW
EXECUTE FUNCTION notify_on_scanner_transaction_insert();
