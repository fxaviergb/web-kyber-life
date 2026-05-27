"use client";

import { useState } from "react";
import { FinancialInstitution } from "@/domain/entities/financial";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Building2 } from "lucide-react";
import { createInstitutionAction, updateInstitutionAction, deleteInstitutionAction } from "@/app/actions/financial-settings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UUID } from "@/domain/core";

interface InstitutionManagerProps {
    initialData: FinancialInstitution[];
}

export function InstitutionManager({ initialData }: InstitutionManagerProps) {
    const [institutions, setInstitutions] = useState<FinancialInstitution[]>(initialData);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<UUID | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState("");

    const handleOpenDialog = (inst?: FinancialInstitution) => {
        if (inst) {
            setEditingId(inst.id!);
            setName(inst.name);
        } else {
            setEditingId(null);
            setName("");
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
            if (editingId) {
                await updateInstitutionAction(editingId, { name });
                setInstitutions(institutions.map(i => i.id === editingId ? { ...i, name } : i));
                toast.success("Institución actualizada");
            } else {
                const newInst = await createInstitutionAction({ name });
                setInstitutions([...institutions, newInst]);
                toast.success("Institución creada");
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Error al guardar");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: UUID) => {
        if (!confirm("¿Seguro que deseas eliminar esta institución?")) return;
        
        try {
            await deleteInstitutionAction(id);
            setInstitutions(institutions.filter(i => i.id !== id));
            toast.success("Institución eliminada");
        } catch (error: any) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="px-0">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Tus Instituciones</CardTitle>
                        <CardDescription>Bancos, cooperativas y otras entidades donde tienes cuentas.</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()} className="gap-2">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Nueva Institución</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Editar Institución" : "Nueva Institución"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="inst-name">Nombre</Label>
                                    <Input 
                                        id="inst-name" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ej. Banco Pichincha"
                                    />
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
                {institutions.filter(i => !i.isDeleted).length === 0 ? (
                    <div className="text-center py-10 text-gray-500 border border-dashed rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
                        <Building2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p>No tienes instituciones registradas.</p>
                        <Button variant="link" onClick={() => handleOpenDialog()}>
                            Añadir la primera
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {institutions.filter(i => !i.isDeleted).map(inst => (
                            <div key={inst.id} className="p-4 border rounded-lg bg-white dark:bg-gray-950 flex items-center justify-between group hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">{inst.name}</h3>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-500" onClick={() => handleOpenDialog(inst)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500" onClick={() => handleDelete(inst.id!)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
