"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

interface ResponsiveDialogProps extends React.ComponentProps<typeof Dialog> {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ResponsiveDialog({ children, ...props }: ResponsiveDialogProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (isDesktop) {
        return <Dialog {...props}>{children}</Dialog>;
    }

    return <Drawer {...props}>{children}</Drawer>;
}

export function ResponsiveDialogTrigger({ children, ...props }: React.ComponentProps<typeof DialogTrigger>) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    if (isDesktop) return <DialogTrigger {...props}>{children}</DialogTrigger>;
    return <DrawerTrigger {...props}>{children}</DrawerTrigger>;
}

export function ResponsiveDialogContent({ children, className, ...props }: React.ComponentProps<typeof DialogContent>) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (isDesktop) {
        return (
            <DialogContent className={className} {...props}>
                {children}
            </DialogContent>
        );
    }

    return (
        <DrawerContent className={className} {...props}>
            <div className="mx-auto w-full max-w-sm flex-1 min-h-0 overflow-hidden flex flex-col">
                {children}
            </div>
        </DrawerContent>
    );
}

export function ResponsiveDialogHeader({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    if (isDesktop) return <DialogHeader className={className} {...props} />;
    return <DrawerHeader className="text-left" {...props} />;
}

export function ResponsiveDialogTitle({
    className,
    ...props
}: React.ComponentProps<typeof DialogTitle>) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    if (isDesktop) return <DialogTitle className={className} {...props} />;
    return <DrawerTitle className={className} {...props} />;
}

export function ResponsiveDialogDescription({ children, className, ...props }: React.ComponentProps<typeof DialogDescription>) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    if (isDesktop) return <DialogDescription className={className} {...props}>{children}</DialogDescription>;
    return <DrawerDescription className={className} {...props}>{children}</DrawerDescription>;
}

export function ResponsiveDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    if (isDesktop) return <DialogFooter className={className} {...props} />;
    return <DrawerFooter className="pt-2" {...props} />;
}
