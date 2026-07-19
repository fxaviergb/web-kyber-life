"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
    listNotificationsAction,
    getUnreadNotificationCountAction,
    markNotificationReadAction,
    markAllNotificationsReadAction,
} from "@/app/actions/notifications";
import { usePushSubscription } from "./usePushSubscription";
import { useNotificationsRealtime } from "./useNotificationsRealtime";

interface NotificationItem {
    id: string;
    type: "SCAN_COMPLETED" | "SCAN_FAILED";
    title: string;
    message: string;
    entityType?: string | null;
    entityId?: string | null;
    isRead: boolean;
    createdAt: string;
}

function relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "ahora";
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `hace ${days} d`;
}

function entityHref(item: NotificationItem): string {
    if (item.entityType === "scan_execution") return "/financial/scans";
    return "/financial";
}

export function NotificationBell({ userId }: { userId: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const push = usePushSubscription();

    const refresh = useCallback(async () => {
        const [listResult, countResult] = await Promise.all([
            listNotificationsAction(20),
            getUnreadNotificationCountAction(),
        ]);
        if (listResult.success) setNotifications(listResult.data as NotificationItem[]);
        if (countResult.success) setUnreadCount(countResult.data as number);
    }, []);

    useEffect(() => {
        refresh().finally(() => setLoading(false));
    }, [refresh]);

    useNotificationsRealtime(userId, refresh);

    const handleSelect = async (item: NotificationItem) => {
        setOpen(false);
        if (!item.isRead) {
            setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
            await markNotificationReadAction(item.id);
        }
        router.push(entityHref(item));
    };

    const handleMarkAllRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        await markAllNotificationsReadAction();
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-bg-hover rounded-full"
                    aria-label="Notificaciones"
                >
                    <Bell className="h-5 w-5 text-text-secondary" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-bg-secondary">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 sm:w-96 p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-base">
                    <p className="text-sm font-semibold text-text-primary">Notificaciones</p>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-1 text-xs font-medium text-accent-primary hover:underline"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Marcar todas como leídas
                        </button>
                    )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-text-tertiary">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-text-tertiary">
                            No tienes notificaciones todavía.
                        </p>
                    ) : (
                        notifications.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className={cn(
                                    "w-full text-left px-4 py-3 border-b border-border-base/60 last:border-b-0 hover:bg-bg-hover transition-colors flex items-start gap-3",
                                    !item.isRead && "bg-accent-primary/5",
                                )}
                            >
                                <span
                                    className={cn(
                                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                                        item.isRead ? "bg-transparent" : "bg-accent-primary",
                                    )}
                                />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-medium text-text-primary truncate">
                                        {item.title}
                                    </span>
                                    <span className="block text-xs text-text-secondary line-clamp-2 mt-0.5">
                                        {item.message}
                                    </span>
                                    <span className="block text-[11px] text-text-tertiary mt-1">
                                        {relativeTime(item.createdAt)}
                                    </span>
                                </span>
                            </button>
                        ))
                    )}
                </div>

                {(push.state === "default" || push.state === "denied") && (
                    <div className="px-4 py-3 border-t border-border-base">
                        <button
                            onClick={push.subscribe}
                            disabled={push.loading || push.state === "denied"}
                            className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {push.loading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <BellRing className="h-3.5 w-3.5" />
                            )}
                            {push.state === "denied"
                                ? "Notificaciones bloqueadas en el navegador"
                                : "Activar notificaciones en este dispositivo"}
                        </button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
