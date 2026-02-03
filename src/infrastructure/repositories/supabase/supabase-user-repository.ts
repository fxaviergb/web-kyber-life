
import { IUserRepository } from "@/domain/repositories";
import { User } from "@/domain/entities";
import { createClient } from "@/infrastructure/supabase/server";

export class SupabaseUserRepository implements IUserRepository {
    async create(entity: User): Promise<User> {
        // In Supabase Auth flow, creation is handled by SignUp + Trigger.
        // This method might be called if we support manual admin creation, but usually it's Auth.
        // If we strictly follow the interface, checking if profile exists might be enough.

        // However, if the App calls this to "update" profile after signup (e.g. onboarding), we should handle it.
        // But the SQL trigger already creates the profile.
        // So we just return the entity as verification or perform an update if fields are missing.

        // Return entity as is or fetch fresh from DB
        return this.findById(entity.id) as Promise<User> || entity;
    }

    async findById(id: string): Promise<User | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;

        // Map to Domain Entity
        return this.mapToEntity(data);
    }

    async findAll(): Promise<User[]> {
        // Usually not allowed for simple users, but implementing for interface compliance
        return [];
    }

    async findByEmail(email: string): Promise<User | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) return null;
        return this.mapToEntity(data);
    }

    async update(entity: User): Promise<User> {
        const supabase = await createClient();

        const updateData: any = {
            first_name: entity.firstName,
            last_name: entity.lastName,
            default_currency_code: entity.defaultCurrencyCode,
            image: entity.image,
            bio: entity.bio,
            country: entity.country,
            province: entity.province,
            city: entity.city,
            parish: entity.parish,
            neighborhood: entity.neighborhood,
            primary_street: entity.primaryStreet,
            secondary_street: entity.secondaryStreet,
            address_reference: entity.addressReference,
            postal_code: entity.postalCode,
            socials: entity.socials,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', entity.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToEntity(data);
    }

    async delete(id: string): Promise<void> {
        const supabase = await createClient();
        // Soft delete
        await supabase.from('profiles').update({ is_deleted: true }).eq('id', id);
    }

    private mapToEntity(row: any): User {
        return {
            id: row.id,
            email: row.email,
            passwordHash: "", // Supabase manages passwords, we don't expose hash
            defaultCurrencyCode: row.default_currency_code,
            image: row.image,
            firstName: row.first_name,
            lastName: row.last_name,
            phone: null, // Schema didn't have phone, fix if needed
            bio: row.bio,
            country: row.country,
            province: row.province,
            city: row.city,
            parish: row.parish,
            neighborhood: row.neighborhood,
            primaryStreet: row.primary_street,
            secondaryStreet: row.secondary_street,
            addressReference: row.address_reference,
            postalCode: row.postal_code,
            socials: row.socials,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isDeleted: row.is_deleted
        };
    }
}
