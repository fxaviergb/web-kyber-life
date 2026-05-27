"use client";

import { useState } from "react";
import { FinancialCategory } from "@/domain/entities/financial";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Tags } from "lucide-react";
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "@/app/actions/financial-settings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UUID } from "@/domain/core";

interface CategoryManagerProps {
    initialData: FinancialCategory[];
}

export function CategoryManager({ initialData }: CategoryManagerProps) {
    const [categories, setCategories] = useState<FinancialCategory[]>(initialData);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<UUID | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleDelete = async (id: UUID) => {
        if (!confirm("¿Seguro que deseas eliminar esta categoría?")) return;
        
        try {
            await deleteCategoryAction(id);
            setCategories(categories.filter(c => c.id !== id));
            toast.success("Categoría eliminada");
        } catch (error: any) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="px-0">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Tus Categorías</CardTitle>
                        <CardDescription>Clasifica tus transacciones para mejores reportes.</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()} className="gap-2">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Nueva Categoría</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cat-name">Nombre</Label>
                                    <Input 
                                        id="cat-name" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ej. Alimentación"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cat-color">Color</Label>
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
                                </div>
                                <Button 
                                    className="w-full" 
                                    onClick={handleSave} 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Guardando..." : "Guardar"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                {categories.filter(c => !c.isDeleted).length === 0 ? (
                    <div className="text-center py-10 text-gray-500 border border-dashed rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
                        <Tags className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p>No tienes categorías registradas.</p>
                        <Button variant="link" onClick={() => handleOpenDialog()}>
                            Añadir la primera
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.filter(c => !c.isDeleted).map(cat => (
                            <div key={cat.id} className="p-4 border rounded-lg bg-white dark:bg-gray-950 flex flex-col gap-2 group hover:border-primary/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-10 h-10 rounded-full flex items-center justify-center opacity-80"
                                            style={{ backgroundColor: `${cat.color || '#3b82f6'}20`, color: cat.color || '#3b82f6' }}
                                        >
                                            <Tags className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                {cat.name}
                                                {cat.ownerUserId === null && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase tracking-wider">
                                                        Sistema
                                                    </span>
                                                )}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {cat.ownerUserId !== null && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-500" onClick={() => handleOpenDialog(cat)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500" onClick={() => handleDelete(cat.id!)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
