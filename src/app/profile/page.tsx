import { cookies } from "next/headers";
import { userService, initializeContainer } from "@/infrastructure/container";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
    initializeContainer();
    const cookieStore = await cookies();
    const userId = cookieStore.get("kyber_session")?.value;

    if (!userId) return <div>Unauthorized</div>;

    const user = await userService.getUser(userId);
    if (!user) return <div>User not found</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-1">Perfil</h1>

            <ProfileForm user={user} />
        </div>
    );
}
