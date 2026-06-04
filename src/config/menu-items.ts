import { Home, ShoppingCart, FileText, BarChart2, Settings, Store, Package, Tag, Scale, User, Wallet, Receipt, Inbox, LucideIcon } from "lucide-react";

export type MenuItem = {
    label: string;
    icon?: LucideIcon;
    href?: string;
    items?: MenuItem[];
    isSection?: boolean;
    activeAliases?: string[];
};

export const MENU_ITEMS: MenuItem[] = [
    { label: "Dashboard", icon: Home, href: "/dashboard" },
    {
        label: "Finanzas",
        isSection: true,
        items: [
            { label: "Resumen", icon: Wallet, href: "/financial" },
            { label: "Transacciones", icon: Receipt, href: "/financial/transactions" },
            { label: "Escaneos", icon: Inbox, href: "/financial/scans", activeAliases: ["/financial/scanner"] },
            { label: "Configuración", icon: Settings, href: "/financial/settings" },
        ]
    },
    {
        label: "Market",
        isSection: true,
        items: [
            { label: "Compras", icon: ShoppingCart, href: "/market/purchases" },
            { label: "Plantillas", icon: FileText, href: "/market/templates" },
            { label: "Productos", icon: Package, href: "/market/items" },
            {
                label: "Configuración",
                icon: Settings,
                items: [
                    { label: "Supermercados", icon: Store, href: "/market/supermarkets" },
                    { label: "Categorías", icon: Tag, href: "/market/categories" },
                    { label: "Unidades", icon: Scale, href: "/market/units" },
                ]
            },
            { label: "Analítica", icon: BarChart2, href: "/market/analytics" },
        ]
    },
    {
        label: "Cuenta",
        isSection: true,
        items: [
            { label: "Perfil", icon: User, href: "/profile" },
        ]
    }
];
