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
            await expect(authService.register({ email: "short@test.com", password: "short" }))
                .rejects.toThrow("Password must be at least 8 characters");
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
    });
});
