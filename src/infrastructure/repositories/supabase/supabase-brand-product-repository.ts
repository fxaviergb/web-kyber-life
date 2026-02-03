
import { IBrandProductRepository } from "@/domain/repositories";
import { BrandProduct } from "@/domain/entities";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabaseBrandProductRepository implements IBrandProductRepository {
    async create(entity: BrandProduct): Promise<BrandProduct> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_brand_products')
            .insert({
                owner_user_id: entity.ownerUserId,
                generic_item_id: entity.genericItemId,
                brand: entity.brand,
                presentation: entity.presentation,
                image_url: entity.imageUrl,
                global_price: entity.globalPrice,
                currency_code: entity.currencyCode
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async findById(id: string): Promise<BrandProduct | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_brand_products')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<BrandProduct[]> {
        return [];
    }

    async findByGenericItemId(genericItemId: string): Promise<BrandProduct[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_brand_products')
            .select('*')
            .eq('generic_item_id', genericItemId)
            .eq('is_deleted', false);

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async findByOwnerId(userId: string): Promise<BrandProduct[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_brand_products')
            .select('*')
            .eq('owner_user_id', userId)
            .eq('is_deleted', false);

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async update(entity: BrandProduct): Promise<BrandProduct> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_brand_products')
            .update({
                brand: entity.brand,
                presentation: entity.presentation,
                image_url: entity.imageUrl,
                global_price: entity.globalPrice,
                currency_code: entity.currencyCode,
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
        await supabase.from('market_brand_products').update({ is_deleted: true }).eq('id', id);
    }

    private mapToEntity(row: any): BrandProduct {
        return {
            id: row.id,
            ownerUserId: row.owner_user_id,
            genericItemId: row.generic_item_id,
            brand: row.brand,
            presentation: row.presentation,
            imageUrl: row.image_url,
            globalPrice: row.global_price,
            currencyCode: row.currency_code,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isDeleted: row.is_deleted
        };
    }
}
