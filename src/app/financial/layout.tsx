import { AppLayout } from "@/presentation/components/layout/AppLayout";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { initializeContainer, userRepository } from "@/infrastructure/container";
import { FinancialRealtimeProvider } from "@/presentation/financial/components/FinancialRealtimeProvider";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Finanzas | KyberLife",
    description: "Gestiona tus finanzas, controla tus gastos y planifica tu presupuesto.",
};

export default async function FinancialLayout({
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

        if (!user) {
            console.warn(`[FinancialLayout] Supabase User ${supabaseUser.id} exists but Profile not found. Using fallback.`);
            user = {
                id: supabaseUser.id,
                email: supabaseUser.email || "",
                passwordHash: "",
                defaultCurrencyCode: "USD",
                image: null,
                firstName: supabaseUser.user_metadata?.first_name || "Usuario",
                lastName: supabaseUser.user_metadata?.last_name || "",
                phone: null,
                bio: null,
                country: null,
                province: null,
                city: null,
                parish: null,
                neighborhood: null,
                primaryStreet: null,
                secondaryStreet: null,
                addressReference: null,
                postalCode: null,
                socials: null,
                role: "USER",
                isDeleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        const cookieStore = await cookies();
        const session = cookieStore.get("kyber_session");

        if (!session || !session.value) {
            redirect("/auth/login");
        }

        user = await userRepository.findById(session.value);
    }

    if (!user) {
        if (dataSource !== 'SUPABASE') {
            redirect("/api/auth/logout");
        }
        redirect("/auth/login");
    }

    return (
        <AppLayout user={user}>
            <div className="flex flex-col w-full h-full">
                <main className="flex-1 w-full flex flex-col items-center">
                    <div className="w-full max-w-5xl">
                        <FinancialRealtimeProvider>
                            {children}
                        </FinancialRealtimeProvider>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
