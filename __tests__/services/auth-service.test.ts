import { AuthService } from "@/application/services/auth-service";
import { InMemoryUserRepository, InMemoryPasswordResetTokenRepository } from "@/infrastructure/repositories/implementations";

describe("AuthService", () => {
    let authService: AuthService;
    let userRepo: InMemoryUserRepository;
    let tokenRepo: InMemoryPasswordResetTokenRepository;

    beforeEach(() => {
        userRepo = new InMemoryUserRepository();
        tokenRepo = new InMemoryPasswordResetTokenRepository();
        authService = new AuthService(userRepo, tokenRepo);
    });

    describe("register", () => {
        it("should register a new user successfully", async () => {
            const dto = { email: "test@example.com", password: "password123" };
            const user = await authService.register(dto);

            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.email).toBe(dto.email);
        });

        it("should fail if password is too short", async () => {
            await expect(authService.register({ email: "short@test.com", password: "123" }))
                .rejects.toThrow("Password must be at least 4 characters");
        });

        it("should fail if email already exists", async () => {
            await authService.register({ email: "test@example.com", password: "password123" });

            await expect(authService.register({ email: "test@example.com", password: "other" }))
                .rejects.toThrow("Email already registered");
        });
    });

    describe("login", () => {
        it("should login successfully with correct credentials", async () => {
            await authService.register({ email: "login@example.com", password: "password123" });
            const user = await authService.login({ email: "login@example.com", password: "password123" });
            expect(user.email).toBe("login@example.com");
        });

        it("should fail with incorrect password", async () => {
            await authService.register({ email: "login@example.com", password: "password123" });
            await expect(authService.login({ email: "login@example.com", password: "wrong" }))
                .rejects.toThrow("Invalid credentials");
        });
    });

    describe("changePassword", () => {
        it("should change password successfully", async () => {
            const user = await authService.register({ email: "change@test.com", password: "oldpassword123" });

            await authService.changePassword({
                userId: user.id,
                currentPassword: "oldpassword123",
                newPassword: "newpassword123"
            });

            // Verify login with new password
            const loggedIn = await authService.login({ email: "change@test.com", password: "newpassword123" });
            expect(loggedIn.id).toBe(user.id);
        });

        it("should fail with incorrect current password", async () => {
            const user = await authService.register({ email: "change2@test.com", password: "oldpassword123" });

            await expect(authService.changePassword({
                userId: user.id,
                currentPassword: "WRONGpassword",
                newPassword: "newpassword123"
            })).rejects.toThrow("Contraseña actual incorrecta");
        });

        it("should fail if user does not exist", async () => {
            await expect(authService.changePassword({
                userId: "non-existent-id",
                currentPassword: "oldpassword123",
                newPassword: "newpassword123"
            })).rejects.toThrow("User not found");
        });
    });

    describe("login (missing branches)", () => {
        it("should fail if user does not exist", async () => {
            await expect(authService.login({ email: "nonexistent@example.com", password: "pwd" }))
                .rejects.toThrow("Invalid credentials");
        });
    });

    describe("password reset flow", () => {
        it("should send a generic message when requesting reset for non-existent email", async () => {
            const result = await authService.requestPasswordReset("nonexistent@example.com");
            expect(result).toBe("If the email exists, a reset link has been sent.");
        });

        it("should generate a reset token and return success message for existing email", async () => {
            await authService.register({ email: "reset@example.com", password: "password123" });
            const result = await authService.requestPasswordReset("reset@example.com");
            expect(result).toBe("Recovery email sent (Check console for mock token)");
            
            // Verify token was created
            const tokens = await tokenRepo.findAll();
            expect(tokens).toHaveLength(1);
            expect(tokens[0].usedAt).toBeNull();
        });

        it("should reset password with valid token", async () => {
            const user = await authService.register({ email: "reset2@example.com", password: "password123" });
            await authService.requestPasswordReset("reset2@example.com");
            
            const tokens = await tokenRepo.findAll();
            const token = tokens[0].tokenHash;

            await authService.resetPassword(token, "newpassword123");

            // Verify login works with new password
            const loggedIn = await authService.login({ email: "reset2@example.com", password: "newpassword123" });
            expect(loggedIn.id).toBe(user.id);

            // Verify token is marked as used
            const updatedToken = await tokenRepo.findById(tokens[0].id);
            expect(updatedToken?.usedAt).not.toBeNull();
        });

        it("should fail to reset password with an invalid token", async () => {
            await expect(authService.resetPassword("invalid-token", "newpassword"))
                .rejects.toThrow("Invalid or expired token");
        });

        it("should fail to reset password if token is expired", async () => {
            const user = await authService.register({ email: "reset3@example.com", password: "pwd1" });
            await authService.requestPasswordReset("reset3@example.com");
            
            const tokens = await tokenRepo.findAll();
            const token = tokens[0];
            
            // Manually expire token
            token.expiresAt = new Date(Date.now() - 3600 * 1000).toISOString();
            await tokenRepo.update(token);

            await expect(authService.resetPassword(token.tokenHash, "newpassword"))
                .rejects.toThrow("Invalid or expired token");
        });

        it("should fail to reset password if token has already been used", async () => {
            await authService.register({ email: "reset4@example.com", password: "pwd1" });
            await authService.requestPasswordReset("reset4@example.com");
            
            const tokens = await tokenRepo.findAll();
            const token = tokens[0];
            
            // Manually mark as used
            token.usedAt = new Date().toISOString();
            await tokenRepo.update(token);

            await expect(authService.resetPassword(token.tokenHash, "newpassword"))
                .rejects.toThrow("Invalid or expired token");
        });

        it("should fail if user does not exist during password reset", async () => {
            // Technically unlikely if token is valid, but good for branch coverage
            await authService.register({ email: "reset5@example.com", password: "pwd1" });
            await authService.requestPasswordReset("reset5@example.com");
            
            const tokens = await tokenRepo.findAll();
            const token = tokens[0];
            
            // Delete user
            await userRepo.delete(token.userId);

            await expect(authService.resetPassword(token.tokenHash, "newpassword"))
                .rejects.toThrow("User not found");
        });
    });
});

