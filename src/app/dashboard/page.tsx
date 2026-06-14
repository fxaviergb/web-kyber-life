import { initializeContainer, userRepository } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HomeDashboard } from "@/presentation/components/dashboard/HomeDashboard";

export default async function DashboardPage() {
    await initializeContainer();

    let userId: string | undefined;
    let userFirstName: string | undefined;

    if (process.env.DATA_SOURCE === "SUPABASE") {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
        userFirstName = user?.user_metadata?.first_name;
    } else {
        const cookieStore = await cookies();
        userId = cookieStore.get("kyber_session")?.value;
        if (userId) {
            const user = await userRepository.findById(userId);
            userFirstName = user?.firstName || undefined;
        }
    }

    if (!userId) {
        redirect("/auth/login");
    }

    return <HomeDashboard userFirstName={userFirstName} />;
}
