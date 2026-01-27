"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
    isLoading?: boolean;
}

export function ConfirmationModal({
    open,
    onOpenChange,
    title = "¿Estás seguro?",
    description = "Esta acción no se puede deshacer.",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    onConfirm,
    variant = "default",
    showCancel = true, // New prop
    isLoading = false
}: ConfirmationModalProps & { showCancel?: boolean }) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-bg-1 border-border">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-text-1">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-text-2">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {showCancel && (
                        <AlertDialogCancel
                            className="bg-bg-2 text-text-1 border-border hover:bg-bg-3"
                            disabled={isLoading}
                        >
                            {cancelText}
                        </AlertDialogCancel>
                    )}
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-accent-violet text-white hover:bg-accent-violet/90"}
                        disabled={isLoading}
                    >
                        {isLoading ? "Procesando..." : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
