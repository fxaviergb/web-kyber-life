import { IFinancialTransactionAuditLogRepository } from "@/domain/repositories/financial";
import { FinancialTransactionAuditLog } from "@/domain/entities/financial";
import { UUID } from "@/domain/core";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabaseFinancialTransactionAuditLogRepository implements IFinancialTransactionAuditLogRepository {
    async create(entity: FinancialTransactionAuditLog): Promise<FinancialTransactionAuditLog> {
        const supabase = await createClient();
        
        const insertData = {
            id: entity.id,
            transaction_id: entity.transactionId,
            changed_by_user_id: entity.changedByUserId,
            action: entity.action,
            previous_state: entity.previousState,
            new_state: entity.newState,
            created_at: entity.createdAt || new Date().toISOString(),
            updated_at: entity.updatedAt || new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('financial_transaction_audit_logs')
            .insert(insertData)
            .select()
            .single();

        if (error) throw new Error(`Error creating audit log: ${error.message}`);
        
        return this.mapToEntity(data);
    }

    async findById(id: UUID): Promise<FinancialTransactionAuditLog | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('financial_transaction_audit_logs')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<FinancialTransactionAuditLog[]> {
        throw new Error("findAll not implemented for audit logs.");
    }

    async update(entity: FinancialTransactionAuditLog): Promise<FinancialTransactionAuditLog> {
        throw new Error("Audit logs should be immutable.");
    }

    async delete(id: UUID): Promise<void> {
        throw new Error("Audit logs cannot be deleted.");
    }

    async findByTransactionId(transactionId: UUID): Promise<FinancialTransactionAuditLog[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('financial_transaction_audit_logs')
            .select('*')
            .eq('transaction_id', transactionId)
            .order('created_at', { ascending: false });

        if (error || !data) return [];
        return data.map(row => this.mapToEntity(row));
    }

    private mapToEntity(row: any): FinancialTransactionAuditLog {
        return {
            id: row.id,
            transactionId: row.transaction_id,
            changedByUserId: row.changed_by_user_id,
            action: row.action,
            previousState: row.previous_state,
            newState: row.new_state,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
