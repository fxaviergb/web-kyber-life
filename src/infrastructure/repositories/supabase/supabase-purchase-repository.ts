
import { IPurchaseRepository } from "@/domain/repositories";
import { Purchase } from "@/domain/entities";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabasePurchaseRepository implements IPurchaseRepository {
    async create(entity: Purchase): Promise<Purchase> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_purchases')
            .insert({
                owner_user_id: entity.ownerUserId,
                supermarket_id: entity.supermarketId,
                date: entity.date,
                currency_code: entity.currencyCode,
                selected_template_ids: entity.selectedTemplateIds,
                total_paid: entity.totalPaid,
                subtotal: entity.subtotal,
                discount: entity.discount,
                tax: entity.tax,
                status: entity.status,
                completed_at: entity.completedAt
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async findById(id: string): Promise<Purchase | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_purchases')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<Purchase[]> {
        return [];
    }

    async findByOwnerId(userId: string): Promise<Purchase[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_purchases')
            .select('*')
            .eq('owner_user_id', userId)
            .eq('is_deleted', false)
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async findRecent(userId: string, limit: number): Promise<Purchase[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_purchases')
            .select('*')
            .eq('owner_user_id', userId)
            .eq('is_deleted', false)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async update(entity: Purchase): Promise<Purchase> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_purchases')
            .update({
                supermarket_id: entity.supermarketId,
                date: entity.date,
                currency_code: entity.currencyCode,
                selected_template_ids: entity.selectedTemplateIds,
                total_paid: entity.totalPaid,
                subtotal: entity.subtotal,
                discount: entity.discount,
                tax: entity.tax,
                status: entity.status,
                completed_at: entity.completedAt,
                updated_at: new Date().toISOString()
            })
            .eq('id', entity.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async delete(id: string): Promise<void> {
        const supabase = await createClient();
        await supabase.from('market_purchases').update({ is_deleted: true }).eq('id', id);
    }

    private mapToEntity(row: any): Purchase {
        return {
            id: row.id,
            ownerUserId: row.owner_user_id,
            supermarketId: row.supermarket_id,
            date: row.date,
            currencyCode: row.currency_code,
            selectedTemplateIds: row.selected_template_ids || [],
            totalPaid: row.total_paid,
            subtotal: row.subtotal,
            discount: row.discount,
            tax: row.tax,
            status: row.status,
            completedAt: row.completed_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isDeleted: row.is_deleted
        };
    }
}
