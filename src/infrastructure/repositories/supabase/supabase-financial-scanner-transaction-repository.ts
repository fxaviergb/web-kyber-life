import { UUID } from "../../../domain/core";
import { FinancialScannerTransaction } from "../../../domain/entities/financial";
import { IFinancialScannerTransactionRepository } from "../../../domain/repositories/financial";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabaseFinancialScannerTransactionRepository implements IFinancialScannerTransactionRepository {
    private tableName = "financial_scanner_transactions";

    private mapToEntity(row: any): FinancialScannerTransaction {
        return {
            id: row.id,
            ownerUserId: row.owner_user_id,
            executionId: row.execution_id,
            rawText: row.raw_text,
            extractedAmount: row.extracted_amount ? Number(row.extracted_amount) : null,
            extractedDate: row.extracted_date,
            extractedMerchant: row.extracted_merchant,
            extractedBank: row.extracted_bank,
            extractedAccountLastFour: row.extracted_account_last_four,
            extractedType: row.extracted_type,
            isProcessed: row.is_processed,
            errorMessage: row.error_message,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isDeleted: false,
        };
    }

    private mapToRow(entity: FinancialScannerTransaction): any {
        return {
            id: entity.id,
            owner_user_id: entity.ownerUserId,
            execution_id: entity.executionId,
            raw_text: entity.rawText,
            extracted_amount: entity.extractedAmount,
            extracted_date: entity.extractedDate,
            extracted_merchant: entity.extractedMerchant,
            extracted_bank: entity.extractedBank,
            extracted_account_last_four: entity.extractedAccountLastFour,
            extracted_type: entity.extractedType,
            is_processed: entity.isProcessed,
            error_message: entity.errorMessage,
        };
    }

    async findById(id: UUID): Promise<FinancialScannerTransaction | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from(this.tableName)
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<FinancialScannerTransaction[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from(this.tableName)
            .select("*")
            .order("created_at", { ascending: false });

        if (error || !data) return [];
        return data.map(this.mapToEntity);
    }

    async create(entity: FinancialScannerTransaction): Promise<FinancialScannerTransaction> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from(this.tableName)
            .insert(this.mapToRow(entity))
            .select()
            .single();

        if (error) throw error;
        return this.mapToEntity(data);
    }

    async update(entity: FinancialScannerTransaction): Promise<FinancialScannerTransaction> {
        const id = entity.id;
        const supabase = await createClient();
        
        // Convert partial entity to row format mapping keys correctly
        const rowData: any = {};
        if (entity.ownerUserId !== undefined) rowData.owner_user_id = entity.ownerUserId;
        if (entity.executionId !== undefined) rowData.execution_id = entity.executionId;
        if (entity.rawText !== undefined) rowData.raw_text = entity.rawText;
        if (entity.extractedAmount !== undefined) rowData.extracted_amount = entity.extractedAmount;
        if (entity.extractedDate !== undefined) rowData.extracted_date = entity.extractedDate;
        if (entity.extractedMerchant !== undefined) rowData.extracted_merchant = entity.extractedMerchant;
        if (entity.extractedBank !== undefined) rowData.extracted_bank = entity.extractedBank;
        if (entity.extractedAccountLastFour !== undefined) rowData.extracted_account_last_four = entity.extractedAccountLastFour;
        if (entity.extractedType !== undefined) rowData.extracted_type = entity.extractedType;
        if (entity.isProcessed !== undefined) rowData.is_processed = entity.isProcessed;
        if (entity.errorMessage !== undefined) rowData.error_message = entity.errorMessage;

        const { data, error } = await supabase
            .from(this.tableName)
            .update(rowData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return this.mapToEntity(data);
    }

    async delete(id: UUID): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq("id", id);

        if (error) throw error;
    }

    async findUnprocessedByOwnerId(userId: UUID): Promise<FinancialScannerTransaction[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from(this.tableName)
            .select("*")
            .eq("owner_user_id", userId)
            .eq("is_processed", false)
            .order("created_at", { ascending: false });

        if (error || !data) return [];
        return data.map(this.mapToEntity);
    }
}
