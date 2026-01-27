"use client";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton({
    variant = "ghost",
    className,
    showLabel = true
}: {
    variant?: "default" | "ghost" | "destructive" | "outline" | "secondary";
    className?: string;
    showLabel?: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={variant} className={className}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {showLabel && "Cerrar Sesión"}
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-bg-1 border-border sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-text-1">¿Cerrar sesión?</DialogTitle>
                    <DialogDescription className="text-text-2">
                        Se cerrará tu sesión actual. Tendrás que ingresar nuevamente para acceder.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:gap-0">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="bg-bg-2 text-text-1 border-border hover:bg-bg-3">
                            Cancelar
                        </Button>
                    </DialogClose>
                    <form action={logoutAction}>
                        <Button type="submit" variant="destructive" className="w-full sm:w-auto">
                            Cerrar Sesión
                        </Button>
                    </form>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
