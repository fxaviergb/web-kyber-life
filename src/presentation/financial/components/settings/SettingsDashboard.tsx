"use client";

import { FinancialInstitution, FinancialInstitutionType, FinancialAccount, FinancialCategory } from "@/domain/entities/financial";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstitutionManager } from "./InstitutionManager";
import { AccountManager } from "./AccountManager";
import { CategoryManager } from "./CategoryManager";
import { Building2, CreditCard, Tags } from "lucide-react";

interface SettingsDashboardProps {
    initialInstitutions: FinancialInstitution[];
    institutionTypes: FinancialInstitutionType[];
    initialAccounts: FinancialAccount[];
    initialCategories: FinancialCategory[];
}

export function SettingsDashboard({
    initialInstitutions,
    institutionTypes,
    initialAccounts,
    initialCategories
}: SettingsDashboardProps) {
    return (
        <Tabs defaultValue="institutions" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="institutions" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Instituciones</span>
                </TabsTrigger>
                <TabsTrigger value="accounts" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Cuentas</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
                    <Tags className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Categorías</span>
                </TabsTrigger>
            </TabsList>
            <TabsContent value="institutions" className="mt-0">
                <InstitutionManager initialData={initialInstitutions} institutionTypes={institutionTypes} />
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
