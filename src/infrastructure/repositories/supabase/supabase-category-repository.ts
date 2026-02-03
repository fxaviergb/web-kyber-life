
import { ICategoryRepository } from "@/domain/repositories";
import { Category } from "@/domain/entities";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabaseCategoryRepository implements ICategoryRepository {
    async create(entity: Category): Promise<Category> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_categories')
            .insert({
                owner_user_id: entity.ownerUserId,
                name: entity.name,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async findById(id: string): Promise<Category | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<Category[]> {
        return [];
    }

    async findAllBaseAndUser(userId: string): Promise<Category[]> {
        const supabase = await createClient();
        // RLS policy handles visibility (own + system)
        // But explicit query:
        const { data, error } = await supabase
            .from('market_categories')
            .select('*')
            .or(`owner_user_id.eq.${userId},owner_user_id.is.null`)
            .eq('is_deleted', false)
            .order('name', { ascending: true });

        if (error) throw new Error(error.message);

        const entities = (data || []).map(this.mapToEntity);

        return entities.sort((a, b) => {
            if (a.name === 'Sin categoría') return -1;
            if (b.name === 'Sin categoría') return 1;
            return a.name.localeCompare(b.name);
        });
    }

    async update(entity: Category): Promise<Category> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_categories')
            .update({
                name: entity.name,
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
        await supabase.from('market_categories').update({ is_deleted: true }).eq('id', id);
    }

    private mapToEntity(row: any): Category {
        return {
            id: row.id,
            ownerUserId: row.owner_user_id,
            name: row.name,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isDeleted: row.is_deleted
        };
    }
}
