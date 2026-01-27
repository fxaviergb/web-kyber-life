import { AppLayout } from "@/presentation/components/layout/AppLayout";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { initializeContainer, userRepository } from "@/infrastructure/container";

export default async function MarketLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await initializeContainer(); // Ensure seeded on first load
    const cookieStore = await cookies();
    const session = cookieStore.get("kyber_session");

    if (!session || !session.value) {
        redirect("/auth/login");
    }

    // Verify user actually exists (Handle In-Memory persistence restart / stale cookie)
    const user = await userRepository.findById(session.value);
    if (!user) {
        // Stale session, force logout by redirecting. 
        // We cannot delete cookie here (Server Component), but login action will overwrite it.
        redirect("/auth/login");
    }

    return <AppLayout>{children}</AppLayout>;
}
