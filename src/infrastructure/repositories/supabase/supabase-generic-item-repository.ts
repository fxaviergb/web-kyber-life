
import { IGenericItemRepository } from "@/domain/repositories";
import { GenericItem } from "@/domain/entities";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabaseGenericItemRepository implements IGenericItemRepository {
    async create(entity: GenericItem): Promise<GenericItem> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_generic_items')
            .insert({
                owner_user_id: entity.ownerUserId,
                canonical_name: entity.canonicalName,
                aliases: entity.aliases,
                primary_category_id: entity.primaryCategoryId,
                secondary_category_ids: entity.secondaryCategoryIds,
                image_url: entity.imageUrl,
                global_price: entity.globalPrice,
                currency_code: entity.currencyCode,
                last_price_update: entity.lastPriceUpdate
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async findById(id: string): Promise<GenericItem | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_generic_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<GenericItem[]> {
        return [];
    }

    async findByOwnerId(userId: string): Promise<GenericItem[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_generic_items')
            .select('*')
            .eq('owner_user_id', userId)
            .eq('is_deleted', false)
            .order('canonical_name');

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async search(userId: string, query: string): Promise<GenericItem[]> {
        const supabase = await createClient();
        // Simple ILIKE search on canonical_name
        // For array search (aliases), standard ILIKE doesn't work directly on text[] easily without unnest or special operators.
        // For V1, searching canonical_name is primary requirement.

        const { data, error } = await supabase
            .from('market_generic_items')
            .select('*')
            .eq('owner_user_id', userId)
            .eq('is_deleted', false)
            .ilike('canonical_name', `%${query}%`)
            .limit(20);

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async update(entity: GenericItem): Promise<GenericItem> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_generic_items')
            .update({
                canonical_name: entity.canonicalName,
                aliases: entity.aliases,
                primary_category_id: entity.primaryCategoryId,
                secondary_category_ids: entity.secondaryCategoryIds,
                image_url: entity.imageUrl,
                global_price: entity.globalPrice,
                currency_code: entity.currencyCode,
                last_price_update: entity.lastPriceUpdate,
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
        await supabase.from('market_generic_items').update({ is_deleted: true }).eq('id', id);
    }

    private mapToEntity(row: any): GenericItem {
        return {
            id: row.id,
            ownerUserId: row.owner_user_id,
            canonicalName: row.canonical_name,
            aliases: row.aliases || [],
            primaryCategoryId: row.primary_category_id,
            secondaryCategoryIds: row.secondary_category_ids || [],
            imageUrl: row.image_url,
            globalPrice: row.global_price,
            currencyCode: row.currency_code,
            lastPriceUpdate: row.last_price_update,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isDeleted: row.is_deleted
        };
    }
}
