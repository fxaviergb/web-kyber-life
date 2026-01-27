"use client";

import { useActionState, useState } from "react";
import { createPurchaseAction } from "@/app/actions/purchase";
import { createSupermarketAction, createTemplateAction } from "@/app/actions/master-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, Check, ChevronsUpDown, Search, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { AddItemForm } from "@/presentation/components/templates/AddItemForm";
import { GenericItem, Unit } from "@/domain/entities";

interface Supermarket { id: string; name: string; }
interface Template { id: string; name: string; }

interface NewPurchaseFormProps {
    initialSupermarkets: Supermarket[];
    initialTemplates: Template[];
    genericItems: GenericItem[];
    units: Unit[];
}

export function NewPurchaseForm({ initialSupermarkets, initialTemplates, genericItems, units }: NewPurchaseFormProps) {
    const [state, formAction, isPending] = useActionState(createPurchaseAction, null);

    // Local state for dynamic lists
    const [supermarkets, setSupermarkets] = useState(initialSupermarkets);
    const [templates, setTemplates] = useState(initialTemplates);

    // Supermarket Selection State
    const [selectedSm, setSelectedSm] = useState<string>("");
    const [smOpen, setSmOpen] = useState(false);
    const [supermarketSearch, setSupermarketSearch] = useState("");

    const filteredSupermarkets = supermarkets.filter(s =>
        s.name.toLowerCase().includes(supermarketSearch.toLowerCase())
    );

    // Quick Create Supermarket State
    const [isSmDialogOpen, setIsSmDialogOpen] = useState(false);
    const [newSmName, setNewSmName] = useState("");
    const [isCreatingSm, setIsCreatingSm] = useState(false);

    // Template Selection State
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
    const [templateSearch, setTemplateSearch] = useState("");

    // Create Template State
    const [isTmplDialogOpen, setIsTmplDialogOpen] = useState(false);
    const [newTmplName, setNewTmplName] = useState("");
    const [isCreatingTmpl, setIsCreatingTmpl] = useState(false);
    const [createdTemplateId, setCreatedTemplateId] = useState<string | null>(null);

    const handleCreateSupermarket = async () => {
        if (!newSmName.trim()) return;
        setIsCreatingSm(true);
        const formData = new FormData();
        formData.append("name", newSmName);
        const res = await createSupermarketAction(formData);
        if (res.success && res.data) {
            setSupermarkets([...supermarkets, res.data]);
            setSelectedSm(res.data.id);
            setNewSmName("");
            setIsSmDialogOpen(false);
        } else {
            console.error(res.error);
        }
        setIsCreatingSm(false);
    };

    const handleCreateTemplate = async () => {
        if (!newTmplName.trim()) return;
        setIsCreatingTmpl(true);
        const formData = new FormData();
        formData.append("name", newTmplName);
        const res = await createTemplateAction(formData);
        if (res.success && res.data) {
            const newTmpl = res.data;
            setTemplates([...templates, newTmpl]);
            setCreatedTemplateId(newTmpl.id);
            setNewTmplName("");
            // Auto Select the new template
            setSelectedTemplateIds(prev => new Set(prev).add(newTmpl.id));
        }
        setIsCreatingTmpl(false);
    };

    const handleCloseTmplDialog = () => {
        setIsTmplDialogOpen(false);
        setCreatedTemplateId(null);
        setNewTmplName("");
    };

    const toggleTemplate = (id: string, checked: boolean) => {
        const next = new Set(selectedTemplateIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedTemplateIds(next);
    };

    // Filter templates
    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(templateSearch.toLowerCase())
    );

    return (
        <Card className="bg-bg-1 border-border shadow-xl">
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-white font-bold">Iniciar Nueva Compra</CardTitle>
                <CardDescription className="text-text-3">Configura los detalles de tu nueva lista de compra.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-8">
                    {/* Date */}
                    <div className="space-y-3">
                        <Label className="text-text-2 font-medium">Fecha</Label>
                        <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-bg-0 border-input h-11" required />
                    </div>

                    {/* Supermarket */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-text-2 font-medium">Supermercado</Label>
                            <Dialog open={isSmDialogOpen} onOpenChange={setIsSmDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="sm" className="h-8 text-accent-mint border-accent-mint/30 hover:bg-accent-mint/10 hover:text-accent-mint">
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-bg-1 border-border">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">Nuevo Supermercado</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label>Nombre</Label>
                                            <Input
                                                value={newSmName}
                                                onChange={e => setNewSmName(e.target.value)}
                                                className="bg-bg-2 border-input"
                                                placeholder="Ej. Walmart"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" onClick={handleCreateSupermarket} disabled={isCreatingSm} className="bg-accent-mint text-bg-1 font-bold">
                                                {isCreatingSm ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear"}
                                            </Button>
                                        </DialogFooter>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Combobox for Supermarket */}
                        <input type="hidden" name="supermarketId" value={selectedSm} />
                        <Popover open={smOpen} onOpenChange={setSmOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={smOpen}
                                    className="w-full justify-between h-11 bg-bg-2 border-input text-text-1 hover:bg-bg-2/80 hover:text-text-1"
                                >
                                    {selectedSm
                                        ? supermarkets.find((s) => s.id === selectedSm)?.name
                                        : "Selecciona un supermercado..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-3 bg-bg-2 border-border" align="start">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
                                        <Input
                                            placeholder="Buscar..."
                                            value={supermarketSearch}
                                            onChange={(e) => setSupermarketSearch(e.target.value)}
                                            className="h-9 pl-8 bg-bg-1 border-border focus-visible:ring-accent-violet"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                                        {filteredSupermarkets.length === 0 ? (
                                            <p className="text-sm text-center text-text-3 py-2">No encontrado.</p>
                                        ) : (
                                            filteredSupermarkets.map((s) => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSm(s.id);
                                                        setSmOpen(false);
                                                        setSupermarketSearch(""); // Reset search on select
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center px-2 py-1.5 text-sm rounded-sm text-left transition-colors hover:bg-bg-1 hover:text-white text-text-1",
                                                        selectedSm === s.id && "bg-accent-violet/10 text-accent-violet"
                                                    )}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedSm === s.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {s.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Templates */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-text-2 font-medium">Plantillas (Opcional)</Label>
                            <Dialog open={isTmplDialogOpen} onOpenChange={(open) => {
                                if (!open) handleCloseTmplDialog();
                                else setIsTmplDialogOpen(true);
                            }}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="sm" className="h-8 text-accent-mint border-accent-mint/30 hover:bg-accent-mint/10 hover:text-accent-mint">
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Nueva
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-bg-1 border-border sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">
                                            {createdTemplateId ? "Agregar Productos a Plantilla" : "Nueva Plantilla"}
                                        </DialogTitle>
                                    </DialogHeader>

                                    {!createdTemplateId ? (
                                        <div className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <Label>Nombre</Label>
                                                <Input
                                                    value={newTmplName}
                                                    onChange={e => setNewTmplName(e.target.value)}
                                                    className="bg-bg-2 border-input"
                                                    placeholder="Ej. Compra Semanal"
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" onClick={handleCreateTemplate} disabled={isCreatingTmpl} className="bg-accent-mint text-bg-1 font-bold">
                                                    {isCreatingTmpl ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continuar"}
                                                </Button>
                                            </DialogFooter>
                                        </div>
                                    ) : (
                                        <div className="pt-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <p className="text-sm text-text-2 mb-4">
                                                La plantilla se ha creado. Ahora puedes agregar productos.
                                            </p>
                                            <AddItemForm
                                                templateId={createdTemplateId}
                                                genericItems={genericItems}
                                                units={units}
                                                onSuccess={() => { /* maybe show toast? */ }}
                                            />
                                            <div className="mt-6 flex justify-end">
                                                <Button type="button" onClick={handleCloseTmplDialog} className="bg-accent-cyan text-bg-1 font-bold">
                                                    Terminar
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Searchable Template List */}
                        <div className="border border-input rounded-lg bg-bg-2 overflow-hidden">
                            <div className="flex items-center border-b border-input px-3 py-2">
                                <Search className="w-4 h-4 text-text-3 mr-2" />
                                <input
                                    className="bg-transparent border-none text-sm text-text-1 placeholder:text-text-3/50 focus:outline-none w-full"
                                    placeholder="Buscar plantillas..."
                                    value={templateSearch}
                                    onChange={(e) => setTemplateSearch(e.target.value)}
                                />
                            </div>
                            <div className="max-h-40 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {filteredTemplates.length === 0 ? (
                                    <p className="text-xs text-text-3 p-2 text-center">No hay plantillas coinciden.</p>
                                ) : (
                                    filteredTemplates.map(t => (
                                        <div
                                            key={t.id}
                                            className="flex items-center space-x-3 p-2 rounded hover:bg-white/5 transition-colors"
                                        >
                                            <Checkbox
                                                id={t.id}
                                                name="templateIds"
                                                value={t.id}
                                                checked={selectedTemplateIds.has(t.id)}
                                                onCheckedChange={(c) => toggleTemplate(t.id, c === true)}
                                                className="border-text-3 data-[state=checked]:bg-accent-cyan data-[state=checked]:border-accent-cyan"
                                            />
                                            <Label htmlFor={t.id} className="text-sm font-medium leading-none text-text-1 cursor-pointer flex-1 py-1">
                                                {t.name}
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-text-3 ml-1">Selecciona una o más plantillas para precargar items.</p>
                        {/* Hidden input to submit selected templates if Checkbox name isn't enough (it should be, but just in case of JS submit) */}
                        {/* Actually, Checkbox with name="templateIds" and value={id} will be submitted if checked. */}
                    </div>

                    {state?.error && (
                        <div className="text-sm text-destructive font-medium text-center bg-destructive/10 p-2 rounded">
                            {state.error}
                        </div>
                    )}

                    <Button type="submit" className="w-full h-12 bg-accent-violet hover:bg-accent-violet/90 text-white font-bold text-lg shadow-lg hover:shadow-accent-violet/20 transition-all mt-4" disabled={isPending}>
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Comenzar Lista"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
