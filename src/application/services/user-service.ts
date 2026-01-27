import { IUserRepository } from "@/domain/repositories";
import { User } from "@/domain/entities";

export interface UpdateProfileDTO {
    userId: string;
    defaultCurrencyCode: string;
}

export class UserService {
    constructor(private userRepo: IUserRepository) { }

    async updateProfile(dto: UpdateProfileDTO): Promise<User> {
        const user = await this.userRepo.findById(dto.userId);
        if (!user) throw new Error("User not found");

        user.defaultCurrencyCode = dto.defaultCurrencyCode;
        user.updatedAt = new Date().toISOString();

        return this.userRepo.update(user);
    }

    async getUser(userId: string): Promise<User | null> {
        return this.userRepo.findById(userId);
    }
}
