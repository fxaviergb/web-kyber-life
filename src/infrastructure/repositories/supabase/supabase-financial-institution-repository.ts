import type { IFinancialInstitutionRepository } from "@/domain/repositories/financial";
import type { FinancialInstitution } from "@/domain/entities/financial";
import type { UUID } from "@/domain/core";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabaseFinancialInstitutionRepository implements IFinancialInstitutionRepository {
    async create(entity: FinancialInstitution): Promise<FinancialInstitution> {
        const supabase = await createClient();
        
        const insertData = {
            id: entity.id,
            owner_user_id: entity.ownerUserId,
            name: entity.name,
            logo_url: entity.logoUrl,
            created_at: entity.createdAt,
            updated_at: entity.updatedAt
        };

        const { data, error } = await supabase
            .from('financial_institutions')
            .insert(insertData)
            .select()
            .single();

        if (error) throw new Error(`Error creating financial institution: ${error.message}`);
        
        return this.mapToEntity(data);
    }

    async findById(id: UUID): Promise<FinancialInstitution | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('financial_institutions')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<FinancialInstitution[]> {
        throw new Error("findAll not implemented for financial_institutions. Use findByOwnerId.");
    }

    async update(entity: FinancialInstitution): Promise<FinancialInstitution> {
        const supabase = await createClient();
        
        const updateData = {
            name: entity.name,
            logo_url: entity.logoUrl,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('financial_institutions')
            .update(updateData)
            .eq('id', entity.id)
            .select()
            .single();

        if (error) throw new Error(`Error updating financial institution: ${error.message}`);
        return this.mapToEntity(data);
    }

    async delete(id: UUID): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase
            .from('financial_institutions')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Error deleting financial institution: ${error.message}`);
    }

    async findByOwnerId(userId: UUID): Promise<FinancialInstitution[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('financial_institutions')
            .select('*')
            .eq('owner_user_id', userId)
            .order('name', { ascending: true });

        if (error || !data) return [];
        return data.map(row => this.mapToEntity(row));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapToEntity(row: any): FinancialInstitution {
        return {
            id: row.id,
            ownerUserId: row.owner_user_id,
            name: row.name,
            logoUrl: row.logo_url,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isDeleted: false,
        };
    }
}
