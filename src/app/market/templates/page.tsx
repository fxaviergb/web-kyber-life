import { templateService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteTemplateButton } from "./delete-template-button";
import { CreateTemplateForm } from "./create-template-form";

export default async function TemplatesPage() {
    await initializeContainer();
    const cookieStore = await cookies();
    const userId = cookieStore.get("kyber_session")?.value!;

    const templates = await templateService.getTemplates(userId);

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Plantillas de Compra</h2>
                    <p className="text-text-3 text-sm">Organiza tus listas recurrentes por tipo o supermercado.</p>
                </div>
            </div>

            <CreateTemplateForm />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(t => (
                    <div key={t.id} className="relative group">
                        <Link href={`/market/templates/${t.id}`} className="block h-full">
                            <div className="p-6 bg-bg-1 border border-border rounded-xl group-hover:border-accent-violet/50 transition-all cursor-pointer group-hover:bg-bg-1/80 h-full flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 bg-accent-cyan/10 rounded-lg">
                                        <FileText className="w-6 h-6 text-accent-cyan" />
                                    </div>
                                    <DeleteTemplateButton id={t.id} name={t.name} />
                                </div>
                                <h3 className="font-bold text-lg text-text-1 mb-2 group-hover:text-accent-violet transition-colors">{t.name}</h3>

                                <div className="flex flex-wrap gap-1.5 mt-auto">
                                    {t.tags.length > 0 ? (
                                        t.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="bg-bg-2 text-text-2 text-[10px] font-medium border-border py-0 h-5">
                                                #{tag}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-[10px] text-text-3 italic">Sin etiquetas</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
                {templates.length === 0 && (
                    <div className="col-span-full py-16 text-center text-text-3 border border-dashed border-border rounded-xl bg-bg-1/30">
                        <div className="max-w-xs mx-auto space-y-3">
                            <FileText className="w-12 h-12 mx-auto opacity-20" />
                            <p>No tienes plantillas guardadas.</p>
                            <p className="text-xs">Crea una para agilizar el inicio de tus próximas compras.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Small correction: move CreateTemplateForm to its own file or keep it here if allowed.
// I'll extract it for better Next.js practices.
