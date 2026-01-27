"use client";

import { useTransition } from "react";
import { deleteTemplateAction } from "@/app/actions/template";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteTemplateButton({ id, name }: { id: string, name: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            await deleteTemplateAction(id);
        });
    };

    return (
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-text-3 hover:text-destructive transition-colors" disabled={isPending}>
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-bg-1 border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-text-1">¿Eliminar plantilla?</AlertDialogTitle>
                        <AlertDialogDescription className="text-text-2">
                            Esta acción eliminará la plantilla <strong>{name}</strong> y todos sus items configurados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-bg-2 text-text-1 border-border">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
