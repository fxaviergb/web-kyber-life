import { IUserRepository, IPasswordResetTokenRepository } from "@/domain/repositories";
import { User, PasswordResetToken } from "@/domain/entities";
import { v4 as uuidv4 } from "uuid";

export interface RegisterDTO {
    email: string;
    password: string;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface ChangePasswordDTO {
    userId: string;
    currentPassword: string;
    newPassword: string;
}

export class AuthService {
    constructor(
        private userRepo: IUserRepository,
        private tokenRepo: IPasswordResetTokenRepository
    ) { }

    async register(dto: RegisterDTO): Promise<User> {
        const existing = await this.userRepo.findByEmail(dto.email);
        if (existing) {
            throw new Error("Email already registered");
        }

        if (dto.password.length < 4) {
            // Lowered requirements for simplicity
            throw new Error("Password must be at least 4 characters");
        }

        // PLAIN TEXT PASSWORD (V1 SIMPLIFICATION)
        const hash = dto.password;

        const newUser: User = {
            id: uuidv4(),
            email: dto.email,
            passwordHash: hash,
            defaultCurrencyCode: "USD",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };

        return this.userRepo.create(newUser);
    }

    async login(dto: LoginDTO): Promise<User> {
        const user = await this.userRepo.findByEmail(dto.email);
        if (!user) {
            // Mock delay for security optimization if needed, but negligible in V1
            throw new Error("Invalid credentials");
        }

        // PLAIN TEXT COMPARISON
        const valid = dto.password === user.passwordHash;
        if (!valid) {
            throw new Error("Invalid credentials");
        }

        return user;
    }

    async requestPasswordReset(email: string): Promise<string> {
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            return "If the email exists, a reset link has been sent.";
        }

        const token = uuidv4();
        // Plain text token storage for simplicity
        const tokenHash = token;

        const resetToken: PasswordResetToken = {
            id: uuidv4(),
            userId: user.id,
            tokenHash: tokenHash,
            expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
            usedAt: null,
            createdAt: new Date().toISOString()
        };

        await this.tokenRepo.create(resetToken);

        console.log(`[MOCK EMAIL] Password Reset Link: http://localhost:3000/auth/restore?token=${token}`);
        return `Recovery email sent (Check console for mock token)`;
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const allTokens = await this.tokenRepo.findAll();

        let validTokenEntity: PasswordResetToken | undefined;

        for (const t of allTokens) {
            if (t.usedAt) continue;
            if (new Date(t.expiresAt) < new Date()) continue;

            // Plain text check
            if (token === t.tokenHash) {
                validTokenEntity = t;
                break;
            }
        }

        if (!validTokenEntity) {
            throw new Error("Invalid or expired token");
        }

        // Update User Password
        const user = await this.userRepo.findById(validTokenEntity.userId);
        if (!user) throw new Error("User not found");

        user.passwordHash = newPassword; // Plain text
        user.updatedAt = new Date().toISOString();
        await this.userRepo.update(user);

        // Mark token used
        validTokenEntity.usedAt = new Date().toISOString();
        await this.tokenRepo.update(validTokenEntity);
    }

    async changePassword(dto: ChangePasswordDTO): Promise<void> {
        const user = await this.userRepo.findById(dto.userId);
        if (!user) throw new Error("User not found");

        // Plain text compare
        const valid = dto.currentPassword === user.passwordHash;
        if (!valid) {
            throw new Error("Contraseña actual incorrecta");
        }

        user.passwordHash = dto.newPassword; // Plain text
        user.updatedAt = new Date().toISOString();
        await this.userRepo.update(user);
    }
}
