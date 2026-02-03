
import { ITemplateRepository } from "@/domain/repositories";
import { Template } from "@/domain/entities";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabaseTemplateRepository implements ITemplateRepository {
    async create(entity: Template): Promise<Template> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_templates')
            .insert({
                owner_user_id: entity.ownerUserId,
                name: entity.name,
                tags: entity.tags
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async findById(id: string): Promise<Template | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_templates')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<Template[]> {
        return [];
    }

    async findByOwnerId(userId: string): Promise<Template[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_templates')
            .select('*')
            .eq('owner_user_id', userId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async update(entity: Template): Promise<Template> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_templates')
            .update({
                name: entity.name,
                tags: entity.tags,
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
        await supabase.from('market_templates').update({ is_deleted: true }).eq('id', id);
    }

    private mapToEntity(row: any): Template {
        return {
            id: row.id,
            ownerUserId: row.owner_user_id,
            name: row.name,
            tags: row.tags || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isDeleted: row.is_deleted
        };
    }
}
