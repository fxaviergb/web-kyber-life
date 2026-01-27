import { AppLayout } from "@/presentation/components/layout/AppLayout";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { initializeContainer, userRepository } from "@/infrastructure/container";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await initializeContainer();
    const cookieStore = await cookies();
    const session = cookieStore.get("kyber_session");

    if (!session || !session.value) {
        redirect("/auth/login");
    }

    const user = await userRepository.findById(session.value);
    if (!user) {
        redirect("/auth/login");
    }

    return <AppLayout>{children}</AppLayout>;
}
