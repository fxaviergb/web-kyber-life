"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Tag, Scale } from "lucide-react";

interface MarketSettingsDashboardProps {
    supermarketsTab: React.ReactNode;
    categoriesTab: React.ReactNode;
    unitsTab: React.ReactNode;
}

export function MarketSettingsDashboard({
    supermarketsTab,
    categoriesTab,
    unitsTab
}: MarketSettingsDashboardProps) {
    return (
        <Tabs defaultValue="supermarkets" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="supermarkets" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
                    <Store className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Supermercados</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
                    <Tag className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Categorías</span>
                </TabsTrigger>
                <TabsTrigger value="units" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
                    <Scale className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Unidades</span>
                </TabsTrigger>
            </TabsList>
            <TabsContent value="supermarkets" className="mt-0">
                {supermarketsTab}
            </TabsContent>
            <TabsContent value="categories" className="mt-0">
                {categoriesTab}
            </TabsContent>
            <TabsContent value="units" className="mt-0">
                {unitsTab}
            </TabsContent>
        </Tabs>
    );
}
