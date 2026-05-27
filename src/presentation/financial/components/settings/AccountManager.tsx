"use client";

import { useState } from "react";
import { FinancialAccount, FinancialInstitution } from "@/domain/entities/financial";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, CreditCard } from "lucide-react";
import { createAccountAction, updateAccountAction, deleteAccountAction } from "@/app/actions/financial-settings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UUID } from "@/domain/core";

interface AccountManagerProps {
    initialData: FinancialAccount[];
    institutions: FinancialInstitution[];
}

export function AccountManager({ initialData, institutions }: AccountManagerProps) {
    const [accounts, setAccounts] = useState<FinancialAccount[]>(initialData);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<UUID | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [accountType, setAccountType] = useState<string>('CHECKING');
    const [currency, setCurrency] = useState('USD');
    const [institutionId, setInstitutionId] = useState<string>("none");

    const handleOpenDialog = (acc?: FinancialAccount) => {
        if (acc) {
            setEditingId(acc.id!);
            setName(acc.name);
            setAccountType(acc.accountType || 'CHECKING');
            setCurrency(acc.currency);
            setInstitutionId(acc.institutionId || "none");
        } else {
            setEditingId(null);
            setName("");
            setAccountType('CHECKING');
            setCurrency('USD');
            setInstitutionId("none");
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
                accountType, 
                currency, 
                institutionId: institutionId === "none" ? null : institutionId 
            };

            if (editingId) {
                await updateAccountAction(editingId, dataToSave);
                setAccounts(accounts.map(a => a.id === editingId ? { ...a, ...dataToSave } as FinancialAccount : a));
                toast.success("Cuenta actualizada");
            } else {
                const newAcc = await createAccountAction(dataToSave);
                setAccounts([...accounts, newAcc]);
                toast.success("Cuenta creada");
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Error al guardar");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: UUID) => {
        if (!confirm("¿Seguro que deseas eliminar esta cuenta?")) return;
        
        try {
            await deleteAccountAction(id);
            setAccounts(accounts.filter(a => a.id !== id));
            toast.success("Cuenta eliminada");
        } catch (error: any) {
            toast.error("Error al eliminar");
        }
    };

    const activeInstitutions = institutions.filter(i => !i.isDeleted);

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="px-0">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Tus Cuentas</CardTitle>
                        <CardDescription>Cuentas corrientes, ahorros, tarjetas, y efectivo.</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()} className="gap-2">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Nueva Cuenta</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Editar Cuenta" : "Nueva Cuenta"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="acc-name">Nombre</Label>
                                    <Input 
                                        id="acc-name" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ej. Ahorros Principal"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select value={accountType} onValueChange={setAccountType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CHECKING">Corriente</SelectItem>
                                            <SelectItem value="SAVINGS">Ahorros</SelectItem>
                                            <SelectItem value="CREDIT_CARD">Tarjeta de Crédito</SelectItem>
                                            <SelectItem value="CASH">Efectivo</SelectItem>
                                            <SelectItem value="INVESTMENT">Inversión</SelectItem>
                                            <SelectItem value="LOAN">Préstamo</SelectItem>
                                            <SelectItem value="OTHER">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Institución (Opcional)</Label>
                                    <Select value={institutionId} onValueChange={setInstitutionId}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin institución</SelectItem>
                                            {activeInstitutions.map(inst => (
                                                <SelectItem key={inst.id} value={inst.id!}>{inst.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Moneda</Label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                {accounts.filter(a => !a.isDeleted).length === 0 ? (
                    <div className="text-center py-10 text-gray-500 border border-dashed rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
                        <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p>No tienes cuentas registradas.</p>
                        <Button variant="link" onClick={() => handleOpenDialog()}>
                            Añadir la primera
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accounts.filter(a => !a.isDeleted).map(acc => {
                            const inst = activeInstitutions.find(i => i.id === acc.institutionId);
                            return (
                                <div key={acc.id} className="p-4 border rounded-lg bg-white dark:bg-gray-950 flex flex-col gap-2 group hover:border-primary/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">{acc.name}</h3>
                                                <p className="text-xs text-gray-500">
                                                    {inst ? inst.name : 'Efectivo / Otro'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-500" onClick={() => handleOpenDialog(acc)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500" onClick={() => handleDelete(acc.id!)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md self-start text-gray-600 dark:text-gray-300">
                                        {acc.accountType === 'CHECKING' ? 'Corriente' : acc.accountType === 'SAVINGS' ? 'Ahorros' : acc.accountType === 'CREDIT_CARD' ? 'Tarjeta' : acc.accountType === 'CASH' ? 'Efectivo' : acc.accountType || 'Cuenta'} • {acc.currency}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
