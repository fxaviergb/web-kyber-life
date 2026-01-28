"use client";

import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
    ResponsiveDialogDescription,
    ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
    showCancel?: boolean;
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
    showCancel = true,
    isLoading = false
}: ConfirmationModalProps) {
    return (
        <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
            <ResponsiveDialogContent className="bg-bg-1 border-border sm:max-w-md">
                <ResponsiveDialogHeader>
                    <ResponsiveDialogTitle className="text-text-1">{title}</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription className="text-text-2">
                        {description}
                    </ResponsiveDialogDescription>
                </ResponsiveDialogHeader>
                <ResponsiveDialogFooter className="gap-2 sm:gap-0">
                    {showCancel && (
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto bg-bg-2 text-text-1 border-border hover:bg-bg-3"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        className={variant === "destructive"
                            ? "w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            : "w-full sm:w-auto bg-accent-violet text-white hover:bg-accent-violet/90"}
                        disabled={isLoading}
                    >
                        {isLoading ? "Procesando..." : confirmText}
                    </Button>
                </ResponsiveDialogFooter>
            </ResponsiveDialogContent>
        </ResponsiveDialog>
    );
}
