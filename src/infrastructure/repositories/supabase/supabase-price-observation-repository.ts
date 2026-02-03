
import { IPriceObservationRepository } from "@/domain/repositories";
import { PriceObservation } from "@/domain/entities";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabasePriceObservationRepository implements IPriceObservationRepository {
    async create(entity: PriceObservation): Promise<PriceObservation> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_price_observations')
            .insert({
                owner_user_id: entity.ownerUserId,
                brand_product_id: entity.brandProductId,
                supermarket_id: entity.supermarketId,
                currency_code: entity.currencyCode,
                unit_price: entity.unitPrice,
                observed_at: entity.observedAt,
                source_purchase_id: entity.sourcePurchaseId
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async findById(id: string): Promise<PriceObservation | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_price_observations')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<PriceObservation[]> {
        return [];
    }

    async findByOwnerId(userId: string): Promise<PriceObservation[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_price_observations')
            .select('*')
            .eq('owner_user_id', userId)
            .eq('is_deleted', false)
            .order('observed_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async findLatestByProductAndSupermarket(brandProductId: string, supermarketId: string): Promise<PriceObservation | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_price_observations')
            .select('*')
            .eq('brand_product_id', brandProductId)
            .eq('supermarket_id', supermarketId)
            .eq('is_deleted', false)
            .order('observed_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') return null; // PGRST116 is 'not found' for single
        if (!data) return null;
        return this.mapToEntity(data);
    }

    async update(entity: PriceObservation): Promise<PriceObservation> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_price_observations')
            .update({
                currency_code: entity.currencyCode,
                unit_price: entity.unitPrice,
                observed_at: entity.observedAt,
                source_purchase_id: entity.sourcePurchaseId,
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
        await supabase.from('market_price_observations').update({ is_deleted: true }).eq('id', id);
    }

    private mapToEntity(row: any): PriceObservation {
        return {
            id: row.id,
            ownerUserId: row.owner_user_id,
            brandProductId: row.brand_product_id,
            supermarketId: row.supermarket_id,
            currencyCode: row.currency_code,
            unitPrice: row.unit_price,
            observedAt: row.observed_at,
            sourcePurchaseId: row.source_purchase_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isDeleted: row.is_deleted
        };
    }
}
