"use client";

import { FinancialInstitution, FinancialAccount, FinancialCategory } from "@/domain/entities/financial";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstitutionManager } from "./InstitutionManager";
import { AccountManager } from "./AccountManager";
import { CategoryManager } from "./CategoryManager";
import { Building2, CreditCard, Tags } from "lucide-react";

interface SettingsDashboardProps {
    initialInstitutions: FinancialInstitution[];
    initialAccounts: FinancialAccount[];
    initialCategories: FinancialCategory[];
}

export function SettingsDashboard({
    initialInstitutions,
    initialAccounts,
    initialCategories
}: SettingsDashboardProps) {
    return (
        <Tabs defaultValue="institutions" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
                <TabsTrigger value="institutions" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Instituciones</span>
                </TabsTrigger>
                <TabsTrigger value="accounts" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="hidden sm:inline">Cuentas</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                    <Tags className="w-4 h-4" />
                    <span className="hidden sm:inline">Categorías</span>
                </TabsTrigger>
            </TabsList>
            <TabsContent value="institutions" className="mt-0">
                <InstitutionManager initialData={initialInstitutions} />
            </TabsContent>
            <TabsContent value="accounts" className="mt-0">
                <AccountManager initialData={initialAccounts} institutions={initialInstitutions} />
            </TabsContent>
            <TabsContent value="categories" className="mt-0">
                <CategoryManager initialData={initialCategories} />
            </TabsContent>
        </Tabs>
    );
}
