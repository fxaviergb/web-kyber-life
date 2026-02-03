
import { ITemplateItemRepository } from "@/domain/repositories";
import { TemplateItem } from "@/domain/entities";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabaseTemplateItemRepository implements ITemplateItemRepository {
    async create(entity: TemplateItem): Promise<TemplateItem> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_template_items')
            .insert({
                template_id: entity.templateId,
                generic_item_id: entity.genericItemId,
                default_qty: entity.defaultQty,
                default_unit_id: entity.defaultUnitId,
                sort_order: entity.sortOrder
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async findById(id: string): Promise<TemplateItem | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_template_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findByTemplateId(templateId: string): Promise<TemplateItem[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_template_items')
            .select('*')
            .eq('template_id', templateId)
            .order('sort_order', { ascending: true });

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async update(entity: TemplateItem): Promise<TemplateItem> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_template_items')
            .update({
                generic_item_id: entity.genericItemId,
                default_qty: entity.defaultQty,
                default_unit_id: entity.defaultUnitId,
                sort_order: entity.sortOrder
            })
            .eq('id', entity.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async delete(id: string): Promise<void> {
        const supabase = await createClient();
        await supabase.from('market_template_items').delete().eq('id', id);
    }

    async deleteByTemplateId(templateId: string): Promise<void> {
        const supabase = await createClient();
        await supabase.from('market_template_items').delete().eq('template_id', templateId);
    }

    private mapToEntity(row: any): TemplateItem {
        return {
            id: row.id,
            templateId: row.template_id,
            genericItemId: row.generic_item_id,
            defaultQty: row.default_qty,
            defaultUnitId: row.default_unit_id,
            sortOrder: row.sort_order
        };
    }
}
