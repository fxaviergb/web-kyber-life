import { templateService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateTemplateDialog } from "./create-template-dialog";
import { TemplateCard } from "./template-card";

export default async function TemplatesPage() {
    await initializeContainer();
    const cookieStore = await cookies();
    const userId = cookieStore.get("kyber_session")?.value!;

    const templates = await templateService.getTemplates(userId);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Plantillas de Compra</h1>
                    <p className="text-text-tertiary mt-1">Organiza tus listas recurrentes por tipo o supermercado</p>
                </div>
                <CreateTemplateDialog />
            </div>

            {templates.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No tienes plantillas guardadas"
                    description="Crea una plantilla para agilizar el inicio de tus próximas compras"
                    action={<CreateTemplateDialog />}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {templates.map(t => (
                        <TemplateCard key={t.id} template={t} />
                    ))}
                </div>
            )}
        </div>
    );
}
