"use client";

import { useTransition } from "react";
import { removeTemplateItemAction } from "@/app/actions/template";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export function RemoveTemplateItemButton({ templateId, itemId }: { templateId: string, itemId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleRemove = () => {
        startTransition(async () => {
            await removeTemplateItemAction(templateId, itemId);
        });
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={isPending}
            className="text-text-3 hover:text-destructive transition-colors h-8 w-8"
        >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
    );
}
