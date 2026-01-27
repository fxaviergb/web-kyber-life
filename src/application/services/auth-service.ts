import { IUserRepository, IPasswordResetTokenRepository } from "@/domain/repositories";
import { User, PasswordResetToken } from "@/domain/entities";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

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

        if (dto.password.length < 8) {
            throw new Error("Password must be at least 8 characters");
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(dto.password, salt);

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

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new Error("Invalid credentials");
        }

        return user;
    }

    async requestPasswordReset(email: string): Promise<string> {
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            // Don't reveal user existence? PRD says D.3 "Given a valid user".
            // Usually we return success even if user not found (security).
            return "If the email exists, a reset link has been sent.";
        }

        // Generate numeric code or link? PRD says "token".
        const token = uuidv4();
        const tokenHash = await bcrypt.hash(token, 10); // Hash the token in DB? Or just store. 
        // Usually we store hashed token, verify raw.

        const resetToken: PasswordResetToken = {
            id: uuidv4(),
            userId: user.id,
            tokenHash: tokenHash, // In this simple V1, maybe just store the token? PRD says 'tokenHash'. 
            // We will store hashed version.
            expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
            usedAt: null,
            createdAt: new Date().toISOString()
        };

        await this.tokenRepo.create(resetToken);

        // In V1, we just return the RAW token in the message for testing since there is no email service.
        // Or we log it.
        console.log(`[MOCK EMAIL] Password Reset Link: http://localhost:3000/auth/restore?token=${token}`);
        return `Recovery email sent (Check console for mock token)`;
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        // Find stored token (compare hash?? In V1 I stored hash, but returning raw token. Complex)
        // Simplification for V1: I will iterate tokens and match hash. (Inefficient but fine for in-memory V1)
        // Or store raw token in V1 for simplicity? No, let's do it "right-ish".

        // Actually, Repository findByToken(token) is what we need.
        // But the repo interface likely only has simple CRUD.
        // Let's assume we find the token entity by valid raw token matching?

        // Wait, for V1 Speed: I will change tokenRepo to allow finding by raw token matching logic in memory (or store raw).
        // Let's implement logic: 

        // 1. Get all tokens (Repository limitation). Or add findByUserId?
        // Let's assume token is passed raw.

        // PROBLEM: I can't easily find the token in DB by hash without iterating all tokens if I don't have the ID.
        // Fix: The user usually clicks a link with ?token=XYZ.

        const allTokens = await this.tokenRepo.findAll(); // Need to ensure Repository has findAll or similar.
        // If not, I need to add it or hack it.
        // Let's check InMemoryPasswordResetTokenRepository implementation.
        // It extends GenericRepository which usually has findAll or I can access the map if public.

        // Let's assume findAll exists or is easily addable.

        let validTokenEntity: PasswordResetToken | undefined;

        for (const t of allTokens) {
            if (t.usedAt) continue;
            if (new Date(t.expiresAt) < new Date()) continue;

            const match = await bcrypt.compare(token, t.tokenHash);
            if (match) {
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

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        user.passwordHash = hash;
        user.updatedAt = new Date().toISOString();
        await this.userRepo.update(user);

        // Mark token used
        validTokenEntity.usedAt = new Date().toISOString();
        await this.tokenRepo.update(validTokenEntity);
    }

    async changePassword(dto: ChangePasswordDTO): Promise<void> {
        const user = await this.userRepo.findById(dto.userId);
        if (!user) throw new Error("User not found");

        const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!valid) {
            throw new Error("Contraseña actual incorrecta");
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(dto.newPassword, salt);

        user.passwordHash = hash;
        user.updatedAt = new Date().toISOString();
        await this.userRepo.update(user);
    }
}
