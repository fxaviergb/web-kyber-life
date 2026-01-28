import { IUserRepository } from "@/domain/repositories";
import { User } from "@/domain/entities";

export interface UpdateProfileDTO {
    userId: string;
    defaultCurrencyCode: string;
    image?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    bio?: string;
    country?: string;
    province?: string;
    city?: string;
    parish?: string;
    neighborhood?: string;
    primaryStreet?: string;
    secondaryStreet?: string;
    addressReference?: string;
    postalCode?: string;
    socials?: {
        facebook?: string;
        twitter?: string;
        linkedin?: string;
        instagram?: string;
    };
}

export class UserService {
    constructor(private userRepo: IUserRepository) { }

    async updateProfile(dto: UpdateProfileDTO): Promise<User> {
        const user = await this.userRepo.findById(dto.userId);
        if (!user) throw new Error("User not found");

        user.defaultCurrencyCode = dto.defaultCurrencyCode;
        if (dto.image !== undefined) user.image = dto.image;
        if (dto.firstName !== undefined) user.firstName = dto.firstName || null;
        if (dto.lastName !== undefined) user.lastName = dto.lastName || null;
        if (dto.phone !== undefined) user.phone = dto.phone || null;
        if (dto.bio !== undefined) user.bio = dto.bio || null;
        if (dto.country !== undefined) user.country = dto.country || null;
        if (dto.province !== undefined) user.province = dto.province || null;
        if (dto.city !== undefined) user.city = dto.city || null;
        if (dto.parish !== undefined) user.parish = dto.parish || null;
        if (dto.neighborhood !== undefined) user.neighborhood = dto.neighborhood || null;
        if (dto.primaryStreet !== undefined) user.primaryStreet = dto.primaryStreet || null;
        if (dto.secondaryStreet !== undefined) user.secondaryStreet = dto.secondaryStreet || null;
        if (dto.addressReference !== undefined) user.addressReference = dto.addressReference || null;
        if (dto.postalCode !== undefined) user.postalCode = dto.postalCode || null;

        if (dto.socials) {
            user.socials = {
                facebook: dto.socials.facebook || null,
                twitter: dto.socials.twitter || null,
                linkedin: dto.socials.linkedin || null,
                instagram: dto.socials.instagram || null,
            };
        }

        user.updatedAt = new Date().toISOString();

        return this.userRepo.update(user);
    }

    async getUser(userId: string): Promise<User | null> {
        return this.userRepo.findById(userId);
    }
}
