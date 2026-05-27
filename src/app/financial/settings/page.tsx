import { 
    getInstitutionsAction, 
    getAccountsAction, 
    getCategoriesAction 
} from "@/app/actions/financial-settings";
import { SettingsDashboard } from "@/presentation/financial/components/settings/SettingsDashboard";

export default async function FinancialSettingsPage() {
    const [institutions, accounts, categories] = await Promise.all([
        getInstitutionsAction(),
        getAccountsAction(),
        getCategoriesAction()
    ]);

    return (
        <div className="w-full flex flex-col min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            <div className="w-full border-b bg-white dark:bg-gray-950 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Configuración Financiera</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona tus instituciones, cuentas y categorías.</p>
            </div>
            <div className="p-4 md:p-6 flex-1 w-full max-w-7xl mx-auto space-y-6">
                <SettingsDashboard 
                    initialInstitutions={institutions}
                    initialAccounts={accounts}
                    initialCategories={categories}
                />
            </div>
        </div>
    );
}
