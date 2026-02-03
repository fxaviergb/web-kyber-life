import { AppLayout } from "@/presentation/components/layout/AppLayout";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { initializeContainer, userRepository } from "@/infrastructure/container";

export default async function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await initializeContainer();

    const dataSource = process.env.DATA_SOURCE;
    let user = null;

    if (dataSource === 'SUPABASE') {
        const { createClient } = await import("@/infrastructure/supabase/server");
        const supabase = await createClient();
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

        if (error || !supabaseUser) {
            redirect("/auth/login");
        }

        user = await userRepository.findById(supabaseUser.id);
    } else {
        const cookieStore = await cookies();
        const session = cookieStore.get("kyber_session");

        if (!session || !session.value) {
            redirect("/auth/login");
        }

        user = await userRepository.findById(session.value);
    }

    if (!user) {
        redirect("/auth/login");
    }

    return <AppLayout user={user}>{children}</AppLayout>;
}
