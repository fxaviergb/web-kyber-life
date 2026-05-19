import { IFinancialTransactionRepository } from "@/domain/repositories/financial";
import { FinancialTransaction } from "@/domain/entities/financial";
import { UUID } from "@/domain/core";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabaseFinancialTransactionRepository implements IFinancialTransactionRepository {
    async create(entity: FinancialTransaction): Promise<FinancialTransaction> {
        const supabase = await createClient();
        
        // Convert camelCase to snake_case for DB
        const insertData = {
            id: entity.id,
            owner_user_id: entity.ownerUserId,
            account_id: entity.accountId,
            type: entity.type,
            status: entity.status,
            amount: entity.amount,
            currency: entity.currency,
            date: entity.date,
            merchant: entity.merchant,
            category_id: entity.categoryId,
            tags: entity.tags || [],
            notes: entity.notes,
            reference_number: entity.referenceNumber,
            possible_duplicate: entity.possibleDuplicate,
            duplicate_of_id: entity.duplicateOfId,
            scan_execution_id: entity.scanExecutionId,
            origin_stats: entity.originStats,
            created_at: entity.createdAt,
            updated_at: entity.updatedAt
        };

        const { data, error } = await supabase
            .from('financial_transactions')
            .insert(insertData)
            .select()
            .single();

        if (error) throw new Error(`Error creating financial transaction: ${error.message}`);
        
        return this.mapToEntity(data);
    }

    async findById(id: UUID): Promise<FinancialTransaction | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<FinancialTransaction[]> {
        throw new Error("findAll not implemented for financial_transactions. Use findByOwnerId.");
    }

    async update(entity: FinancialTransaction): Promise<FinancialTransaction> {
        const supabase = await createClient();
        
        const updateData = {
            account_id: entity.accountId,
            type: entity.type,
            status: entity.status,
            amount: entity.amount,
            currency: entity.currency,
            date: entity.date,
            merchant: entity.merchant,
            category_id: entity.categoryId,
            tags: entity.tags || [],
            notes: entity.notes,
            reference_number: entity.referenceNumber,
            possible_duplicate: entity.possibleDuplicate,
            duplicate_of_id: entity.duplicateOfId,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('financial_transactions')
            .update(updateData)
            .eq('id', entity.id)
            .select()
            .single();

        if (error) throw new Error(`Error updating financial transaction: ${error.message}`);
        return this.mapToEntity(data);
    }

    async delete(id: UUID): Promise<void> {
        const supabase = await createClient();
        // Since we don't have is_deleted for transactions, we use hard delete or rely on RLS/status.
        // If hard delete is expected:
        const { error } = await supabase
            .from('financial_transactions')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Error deleting financial transaction: ${error.message}`);
    }

    async findByOwnerId(userId: UUID): Promise<FinancialTransaction[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .eq('owner_user_id', userId)
            .order('date', { ascending: false });

        if (error || !data) return [];
        return data.map(row => this.mapToEntity(row));
    }

    async findRecent(userId: UUID, limit: number): Promise<FinancialTransaction[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .eq('owner_user_id', userId)
            .order('date', { ascending: false })
            .limit(limit);

        if (error || !data) return [];
        return data.map(row => this.mapToEntity(row));
    }

    async search(userId: UUID, query: string, filters?: any): Promise<FinancialTransaction[]> {
        const supabase = await createClient();
        
        let queryBuilder = supabase
            .from('financial_transactions')
            .select('*')
            .eq('owner_user_id', userId);

        if (query) {
            queryBuilder = queryBuilder.ilike('merchant', `%${query}%`);
        }

        if (filters) {
            if (filters.status) queryBuilder = queryBuilder.eq('status', filters.status);
            if (filters.type) queryBuilder = queryBuilder.eq('type', filters.type);
            // More filters could be added here depending on UI needs
        }

        const { data, error } = await queryBuilder.order('date', { ascending: false });

        if (error || !data) return [];
        return data.map(row => this.mapToEntity(row));
    }

    private mapToEntity(row: any): FinancialTransaction {
        return {
            id: row.id,
            ownerUserId: row.owner_user_id,
            accountId: row.account_id,
            type: row.type,
            status: row.status,
            amount: row.amount,
            currency: row.currency,
            date: row.date,
            merchant: row.merchant,
            categoryId: row.category_id,
            tags: row.tags || [],
            notes: row.notes,
            referenceNumber: row.reference_number,
            possibleDuplicate: row.possible_duplicate,
            duplicateOfId: row.duplicate_of_id,
            scanExecutionId: row.scan_execution_id,
            originStats: row.origin_stats,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
