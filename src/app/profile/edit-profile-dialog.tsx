"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Pen } from "lucide-react";
import { useState, ReactNode, useEffect } from "react";
import { useActionState } from "react";

interface EditProfileDialogProps {
    title: string;
    description?: string;
    trigger?: ReactNode;
    children: ReactNode;
    action: (prevState: any, formData: FormData) => Promise<any>;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function EditProfileDialog({
    title,
    description,
    trigger,
    children,
    action,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
}: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [state, formAction, isPending] = useActionState(action, null);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : open;
    const onOpenChange = isControlled ? setControlledOpen : setOpen;

    useEffect(() => {
        if (state?.success && onOpenChange) {
            onOpenChange(false);
        }
    }, [state?.success, onOpenChange]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Pen className="h-3 w-3" />
                        Editar
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>

                <form action={formAction} className="space-y-6">
                    <div className="grid gap-4 py-4">
                        {children}
                    </div>

                    {state?.error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            {state.error}
                        </div>
                    )}

                    <DialogFooter>
                        {onOpenChange && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancelar
                            </Button>
                        )}
                        <Button type="submit" disabled={isPending} className="bg-accent-primary text-white hover:bg-accent-primary-hover">
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
