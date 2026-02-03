
import { IUnitRepository } from "@/domain/repositories";
import { Unit } from "@/domain/entities";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabaseUnitRepository implements IUnitRepository {
    async create(entity: Unit): Promise<Unit> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_units')
            .insert({
                owner_user_id: entity.ownerUserId,
                name: entity.name,
                symbol: entity.symbol
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async findById(id: string): Promise<Unit | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_units')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<Unit[]> {
        return [];
    }

    async findAllBaseAndUser(userId: string): Promise<Unit[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_units')
            .select('*')
            .or(`owner_user_id.eq.${userId},owner_user_id.is.null`)
            .eq('is_deleted', false);

        if (error) throw new Error(error.message);
        return (data || []).map(this.mapToEntity);
    }

    async update(entity: Unit): Promise<Unit> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('market_units')
            .update({
                name: entity.name,
                symbol: entity.symbol,
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
        await supabase.from('market_units').update({ is_deleted: true }).eq('id', id);
    }

    private mapToEntity(row: any): Unit {
        return {
            id: row.id,
            ownerUserId: row.owner_user_id,
            name: row.name,
            symbol: row.symbol,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isDeleted: row.is_deleted
        };
    }
}
