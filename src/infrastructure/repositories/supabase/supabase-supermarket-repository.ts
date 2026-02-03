
import { ISupermarketRepository } from "@/domain/repositories";
import { Supermarket } from "@/domain/entities";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabaseSupermarketRepository implements ISupermarketRepository {
    async create(entity: Supermarket): Promise<Supermarket> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_supermarkets')
            .insert({
                owner_user_id: entity.ownerUserId,
                name: entity.name,
                address: entity.address
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async findById(id: string): Promise<Supermarket | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_supermarkets')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<Supermarket[]> {
        return [];
    }

    async findByOwnerId(userId: string): Promise<Supermarket[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_supermarkets')
            .select('*')
            .eq('owner_user_id', userId)
            .eq('is_deleted', false);

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async update(entity: Supermarket): Promise<Supermarket> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_supermarkets')
            .update({
                name: entity.name,
                address: entity.address,
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
        await supabase.from('market_supermarkets').update({ is_deleted: true }).eq('id', id);
    }

    private mapToEntity(row: any): Supermarket {
        return {
            id: row.id,
            ownerUserId: row.owner_user_id,
            name: row.name,
            address: row.address,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isDeleted: row.is_deleted
        };
    }
}
