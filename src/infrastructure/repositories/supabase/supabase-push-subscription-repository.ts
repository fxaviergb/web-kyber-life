import type { PushSubscription } from "@/domain/entities/notification";
import type { IPushSubscriptionRepository } from "@/domain/repositories/notification";
import type { UUID } from "@/domain/core";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabasePushSubscriptionRepository implements IPushSubscriptionRepository {
    private tableName = 'push_subscriptions';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapToEntity(data: any): PushSubscription {
        return {
            id: data.id,
            ownerUserId: data.owner_user_id,
            endpoint: data.endpoint,
            keys: { p256dh: data.p256dh, auth: data.auth_key },
            userAgent: data.user_agent,
            isDeleted: false,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    }

    private mapToRow(entity: PushSubscription) {
        return {
            id: entity.id,
            owner_user_id: entity.ownerUserId,
            endpoint: entity.endpoint,
            p256dh: entity.keys.p256dh,
            auth_key: entity.keys.auth,
            user_agent: entity.userAgent,
            created_at: entity.createdAt,
            updated_at: entity.updatedAt,
        };
    }

    async findById(id: UUID): Promise<PushSubscription | null> {
        const supabase = await createClient();
        const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id).single();
        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<PushSubscription[]> {
        const supabase = await createClient();
        const { data, error } = await supabase.from(this.tableName).select('*');
        if (error || !data) return [];
        return data.map((row) => this.mapToEntity(row));
    }

    async create(entity: PushSubscription): Promise<PushSubscription> {
        const supabase = await createClient();
        // Upsert by endpoint: re-subscribing on the same device/browser
        // should update the existing row, not create a duplicate.
        const { data, error } = await supabase
            .from(this.tableName)
            .upsert(this.mapToRow(entity), { onConflict: 'endpoint' })
            .select()
            .single();

        if (error) throw error;
        return this.mapToEntity(data);
    }

    async update(entity: PushSubscription): Promise<PushSubscription> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from(this.tableName)
            .update(this.mapToRow(entity))
            .eq('id', entity.id)
            .select()
            .single();

        if (error) throw error;
        return this.mapToEntity(data);
    }

    async delete(id: UUID): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase.from(this.tableName).delete().eq('id', id);
        if (error) throw error;
    }

    async findByOwnerId(userId: UUID): Promise<PushSubscription[]> {
        const supabase = await createClient();
        const { data, error } = await supabase.from(this.tableName).select('*').eq('owner_user_id', userId);
        if (error) {
            console.error(`Error finding ${this.tableName} by user:`, error);
            return [];
        }
        return (data || []).map((row) => this.mapToEntity(row));
    }

    async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
        const supabase = await createClient();
        const { data, error } = await supabase.from(this.tableName).select('*').eq('endpoint', endpoint).single();
        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async deleteByEndpoint(endpoint: string, userId: UUID): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('endpoint', endpoint)
            .eq('owner_user_id', userId);

        if (error) throw error;
    }
}
