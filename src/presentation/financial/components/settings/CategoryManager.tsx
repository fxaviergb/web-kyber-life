"use client";

import { useState, useEffect } from "react";
import { FinancialCategory } from "@/domain/entities/financial";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Tags } from "lucide-react";
import { createCategoryAction, updateCategoryAction, deleteCategoryAction, getCategoryTransactionCountAction } from "@/app/actions/financial-settings";
import { FormSheet } from "@/components/ui/form-sheet";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UUID } from "@/domain/core";
import * as Icons from "lucide-react";

interface CategoryManagerProps {
    initialData: FinancialCategory[];
}

export function CategoryManager({ initialData }: CategoryManagerProps) {
    const [categories, setCategories] = useState<FinancialCategory[]>(initialData);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<UUID | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete confirmation state
    const [deletingCat, setDeletingCat] = useState<FinancialCategory | null>(null);
    const [deleteCount, setDeleteCount] = useState<number | null>(null); // null while counting
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setCategories(initialData);
    }, [initialData]);

    // Form state
    const [name, setName] = useState("");
    const [color, setColor] = useState("#3b82f6"); // Default blue

    const handleOpenDialog = (cat?: FinancialCategory) => {
        if (cat) {
            setEditingId(cat.id!);
            setName(cat.name);
            setColor(cat.color || "#3b82f6");
        } else {
            setEditingId(null);
            setName("");
            setColor("#3b82f6");
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("El nombre es requerido");
            return;
        }

        setIsSubmitting(true);
        try {
            const dataToSave = { 
                name, 
                color
            };

            if (editingId) {
                await updateCategoryAction(editingId, dataToSave);
                setCategories(categories.map(c => c.id === editingId ? { ...c, ...dataToSave } as FinancialCategory : c));
                toast.success("Categoría actualizada");
            } else {
                const newCat = await createCategoryAction(dataToSave);
                setCategories([...categories, newCat]);
                toast.success("Categoría creada");
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Error al guardar");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRequest = async (cat: FinancialCategory) => {
        setDeletingCat(cat);
        setDeleteCount(null);
        try {
            const count = await getCategoryTransactionCountAction(cat.id!);
            setDeleteCount(count);
        } catch {
            // If the count can't be resolved, fall back to the plain confirmation.
            setDeleteCount(0);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingCat) return;
        setIsDeleting(true);
        try {
            const { reassignedCount } = await deleteCategoryAction(deletingCat.id!);
            setCategories(prev => prev.filter(c => c.id !== deletingCat.id));
            if (reassignedCount > 0) {
                const noun = reassignedCount === 1 ? "transacción reasignada" : "transacciones reasignadas";
                toast.success(`Categoría eliminada. ${reassignedCount} ${noun} a «Otros».`);
            } else {
                toast.success("Categoría eliminada");
            }
            setDeletingCat(null);
            setDeleteCount(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al eliminar");
        } finally {
            setIsDeleting(false);
        }
    };

    const deleteDescription = deleteCount === null
        ? "Comprobando transacciones asociadas…"
        : deleteCount > 0
            ? `Esta categoría tiene ${deleteCount} ${deleteCount === 1 ? "transacción asociada" : "transacciones asociadas"}. Al eliminarla, ${deleteCount === 1 ? "esa transacción quedará huérfana y se marcará" : "esas transacciones quedarán huérfanas y se marcarán"} con la categoría «Otros». ¿Deseas continuar?`
            : "¿Seguro que deseas eliminar esta categoría? Esta acción no se puede deshacer.";

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Tus Categorías</CardTitle>
                        <CardDescription>Clasifica tus transacciones para mejores reportes.</CardDescription>
                    </div>
                    <FormSheet
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                        trigger={
                            <Button onClick={() => handleOpenDialog()} className="gap-2">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Nueva Categoría</span>
                            </Button>
                        }
                        title={editingId ? "Editar Categoría" : "Nueva Categoría"}
                        bodyClassName="space-y-4 py-4"
                        footer={
                            <Button className="w-full" onClick={handleSave} disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Guardar"}
                            </Button>
                        }
                    >
                        <Field label="Nombre" htmlFor="cat-name">
                            <Input
                                id="cat-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej. Alimentación"
                            />
                        </Field>
                        <Field label="Color" htmlFor="cat-color">
                            <div className="flex gap-3 items-center">
                                <Input
                                    id="cat-color"
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-14 h-10 p-1 cursor-pointer"
                                />
                                <span className="text-sm text-gray-500 uppercase">{color}</span>
                            </div>
                        </Field>
                    </FormSheet>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                {categories.filter(c => !c.isDeleted).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/30">
                        <Tags className="w-10 h-10 mx-auto mb-4 opacity-20" />
                        <p className="font-medium text-foreground">No tienes categorías registradas</p>
                        <p className="text-sm mt-1 mb-4">Añade categorías para organizar tus gastos.</p>
                        <Button variant="outline" onClick={() => handleOpenDialog()}>
                            Añadir la primera
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {categories.filter(c => !c.isDeleted).map(cat => {
                            const IconComponent = cat.icon && (Icons as any)[cat.icon] ? (Icons as any)[cat.icon] : Tags;
                            return (
                            <div key={cat.id} className="p-5 border rounded-xl bg-card shadow-sm flex flex-col gap-2 group hover:border-primary/50 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div 
                                            className="w-12 h-12 rounded-full flex items-center justify-center opacity-90 shadow-sm"
                                            style={{ backgroundColor: `${cat.color || '#3b82f6'}25`, color: cat.color || '#3b82f6' }}
                                        >
                                            <IconComponent className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-base text-card-foreground flex items-center gap-2">
                                                {cat.name}
                                                {cat.ownerUserId === null && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider font-medium">
                                                        Sistema
                                                    </span>
                                                )}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {cat.ownerUserId !== null && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10" onClick={() => handleOpenDialog(cat)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDeleteRequest(cat)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            <ConfirmationModal
                open={!!deletingCat}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setDeletingCat(null);
                        setDeleteCount(null);
                    }
                }}
                title={`Eliminar «${deletingCat?.name ?? ""}»`}
                description={deleteDescription}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
                isLoading={isDeleting || deleteCount === null}
                onConfirm={handleDeleteConfirm}
            />
        </Card>
    );
}
