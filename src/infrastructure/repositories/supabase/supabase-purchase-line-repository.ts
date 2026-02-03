
import { IPurchaseLineRepository } from "@/domain/repositories";
import { PurchaseLine } from "@/domain/entities";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabasePurchaseLineRepository implements IPurchaseLineRepository {
    async create(entity: PurchaseLine): Promise<PurchaseLine> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_purchase_lines')
            .insert({
                purchase_id: entity.purchaseId,
                generic_item_id: entity.genericItemId,
                brand_product_id: entity.brandProductId,
                qty: entity.qty,
                unit_id: entity.unitId,
                unit_price: entity.unitPrice,
                checked: entity.checked,
                line_amount_override: entity.lineAmountOverride,
                note: entity.note
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async createMany(lines: PurchaseLine[]): Promise<PurchaseLine[]> {
        if (lines.length === 0) return [];
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_purchase_lines')
            .insert(lines.map(l => ({
                purchase_id: l.purchaseId,
                generic_item_id: l.genericItemId,
                brand_product_id: l.brandProductId,
                qty: l.qty,
                unit_id: l.unitId,
                unit_price: l.unitPrice,
                checked: l.checked,
                line_amount_override: l.lineAmountOverride,
                note: l.note
            })))
            .select();

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async findById(id: string): Promise<PurchaseLine | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_purchase_lines')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findByPurchaseId(purchaseId: string): Promise<PurchaseLine[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_purchase_lines')
            .select('*')
            .eq('purchase_id', purchaseId)
            .eq('is_deleted', false)
            // Sort? Usually creation order or valid sorting.
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async findByPurchaseIds(purchaseIds: string[]): Promise<PurchaseLine[]> {
        if (purchaseIds.length === 0) return [];
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_purchase_lines')
            .select('*')
            .in('purchase_id', purchaseIds)
            .eq('is_deleted', false);

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async update(entity: PurchaseLine): Promise<PurchaseLine> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_purchase_lines')
            .update({
                generic_item_id: entity.genericItemId,
                brand_product_id: entity.brandProductId,
                qty: entity.qty,
                unit_id: entity.unitId,
                unit_price: entity.unitPrice,
                checked: entity.checked,
                line_amount_override: entity.lineAmountOverride,
                note: entity.note,
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
        await supabase.from('market_purchase_lines').update({ is_deleted: true }).eq('id', id);
    }

    async deleteByPurchaseId(purchaseId: string): Promise<void> {
        const supabase = await createClient();
        await supabase.from('market_purchase_lines').delete().eq('purchase_id', purchaseId);
    }

    private mapToEntity(row: any): PurchaseLine {
        return {
            id: row.id,
            purchaseId: row.purchase_id,
            genericItemId: row.generic_item_id,
            brandProductId: row.brand_product_id,
            qty: row.qty,
            unitId: row.unit_id,
            unitPrice: row.unit_price,
            checked: row.checked,
            lineAmountOverride: row.line_amount_override,
            note: row.note,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isDeleted: row.is_deleted
        };
    }
}
