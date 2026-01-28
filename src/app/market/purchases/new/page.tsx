import { masterDataService, templateService, productService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NewPurchaseForm } from "./NewPurchaseForm";

export default async function NewPurchasePage() {
    await initializeContainer();
    const cookieStore = await cookies();
    const userId = cookieStore.get("kyber_session")?.value;

    if (!userId) {
        redirect("/auth/login");
    }

    const [supermarkets, templates, genericItems, units] = await Promise.all([
        masterDataService.getSupermarkets(userId),
        templateService.getTemplates(userId),
        productService.getGenericItems(userId),
        masterDataService.getUnits(userId)
    ]);

    return (
        <div className="p-6 md:p-8 max-w-2xl mx-auto">
            <NewPurchaseForm
                initialSupermarkets={supermarkets}
                initialTemplates={templates}
                genericItems={genericItems}
                units={units}
            />
        </div>
    );
}
