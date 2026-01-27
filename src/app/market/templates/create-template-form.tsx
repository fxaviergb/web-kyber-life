"use client";

import { createTemplateAction } from "@/app/actions/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Tag as TagIcon, Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

export function CreateTemplateForm() {
    const [state, formAction, isPending] = useActionState(createTemplateAction, null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
        }
    }, [state]);

    return (
        <Card className="bg-bg-1 border-border p-5 border-dashed">
            <div className="flex items-center gap-2 mb-4 text-accent-violet">
                <Plus className="w-5 h-5" />
                <h3 className="font-semibold text-text-1">Nueva Plantilla</h3>
            </div>
            <form ref={formRef} action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                    <Input name="name" placeholder="Nombre (ej. Super Semanal)..." className="bg-bg-2 border-border text-text-1" required />
                </div>
                <div className="space-y-1">
                    <div className="relative">
                        <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                        <Input name="tags" placeholder="Etiquetas (comida, aseo...)" className="bg-bg-2 border-border text-text-1 pl-9" />
                    </div>
                </div>
                <Button type="submit" disabled={isPending} className="bg-accent-violet hover:bg-accent-violet/90 text-white font-medium">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Crear Plantilla
                </Button>
            </form>
            {state?.error && <p className="text-destructive text-sm mt-2">{state.error}</p>}
        </Card>
    );
}
