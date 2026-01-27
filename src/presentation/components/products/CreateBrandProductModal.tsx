"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useActionState, useEffect, useState, startTransition } from "react";
import { createBrandProductAction, getBrandProductsAction } from "@/app/actions/product";
import { Loader2, AlertTriangle, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { BrandProduct } from "@/domain/entities";

interface CreateBrandProductModalProps {
    genericItemId: string;
    genericItemName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (brandProduct: BrandProduct) => void;
}

export function CreateBrandProductModal({
    genericItemId,
    genericItemName,
    open,
    onOpenChange,
    onSuccess
}: CreateBrandProductModalProps) {
    const [step, setStep] = useState<"form" | "confirm">("form");
    const [brand, setBrand] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [globalPrice, setGlobalPrice] = useState("");
    const [loading, setLoading] = useState(false);

    // Bound Action for final submission
    const action = createBrandProductAction.bind(null, genericItemId);
    const [state, formAction, isPending] = useActionState(action, null);

    useEffect(() => {
        if (state?.success && state.data) {
            onSuccess?.(state.data);
            onOpenChange(false);
            reset();
        }
    }, [state, onOpenChange, onSuccess]);

    function reset() {
        setStep("form");
        setBrand("");
        setImageUrl("");
        setGlobalPrice("");
        setLoading(false);
    }

    // Reset on close
    useEffect(() => {
        if (!open) {
            setTimeout(reset, 200);
        }
    }, [open]);

    async function handlePreSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        if (!brand.trim()) return;

        setLoading(true);
        // 1. Check for duplicates
        const existingBrands = await getBrandProductsAction(genericItemId);
        const match = existingBrands.find(b => b.brand.toLowerCase() === brand.trim().toLowerCase());

        if (match) {
            setStep("confirm");
            setLoading(false);
            return;
        }

        // 2. If no duplicate, submit form
        setLoading(false);
        const formData = new FormData(form);
        startTransition(() => {
            formAction(formData);
        });
    }

    function handleForceSubmit() {
        const formData = new FormData();
        formData.set("brand", brand);
        formData.set("imageUrl", imageUrl);
        formData.set("globalPrice", globalPrice);
        formData.set("currencyCode", "USD");

        startTransition(() => {
            formAction(formData);
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-bg-1 border-border sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-text-1">
                        {step === "form" ? `Nueva Opción para ${genericItemName}` : "Marca Existente"}
                    </DialogTitle>
                    <DialogDescription className="text-text-2">
                        {step === "form"
                            ? "Si no encontraste la marca o presentación, créala aquí."
                            : `Ya existe una opción para la marca "${brand}".`}
                    </DialogDescription>
                </DialogHeader>

                {step === "form" ? (
                    <form onSubmit={handlePreSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="brand" className="text-text-1">Marca</Label>
                                <Input
                                    id="brand"
                                    name="brand"
                                    placeholder="Ej. Bimbo"
                                    required
                                    className="bg-bg-0 text-text-1"
                                    value={brand}
                                    onChange={e => setBrand(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="imageUrl" className="text-text-1">Imagen URL (Opcional)</Label>
                            <Input
                                id="imageUrl"
                                name="imageUrl"
                                placeholder="https://..."
                                className="bg-bg-0 text-text-1"
                                value={imageUrl}
                                onChange={e => setImageUrl(e.target.value)}
                            />
                        </div>

                        <Separator className="bg-border" />

                        <div className="grid gap-2">
                            <Label className="text-text-1">Precio Referencial (Opcional)</Label>
                            <div className="flex gap-2">
                                <Input
                                    name="globalPrice"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="bg-bg-0 text-text-1 flex-1"
                                    value={globalPrice}
                                    onChange={e => setGlobalPrice(e.target.value)}
                                />
                                <Input
                                    name="currencyCode"
                                    defaultValue="USD"
                                    className="bg-bg-0 text-text-1 w-20"
                                    readOnly
                                />
                            </div>
                        </div>

                        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-text-3">Cancelar</Button>
                            <Button type="submit" disabled={isPending || loading} className="bg-accent-violet text-white">
                                {isPending || loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Opción"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-6 py-6">
                        <div className="p-4 rounded-xl bg-accent-violet/5 border border-accent-violet/20 text-center space-y-2">
                            <p className="text-text-1 text-sm">
                                ¿Quieres crear otra opción para esta marca de todos modos o prefieres volver atrás?
                            </p>
                        </div>

                        <div className="grid gap-3">
                            <Button
                                variant="outline"
                                className="w-full border-border text-text-1 hover:bg-glass"
                                onClick={() => setStep("form")}
                                disabled={isPending}
                            >
                                Atrás y cambiar nombre
                            </Button>
                            <Button
                                className="w-full bg-accent-violet text-white hover:bg-accent-violet/90"
                                onClick={handleForceSubmit}
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                Crear de todas formas
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
