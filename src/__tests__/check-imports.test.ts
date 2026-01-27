import { ProductService } from "@/application/services/product-service";
import {
    InMemoryGenericItemRepository,
    InMemoryBrandProductRepository,
    InMemoryPriceObservationRepository,
    InMemoryPurchaseRepository,
    InMemoryPurchaseLineRepository,
    InMemoryTemplateRepository,
    InMemoryTemplateItemRepository
} from "@/infrastructure/repositories/implementations";
import { PurchaseService } from "@/application/services/purchase-service";
import { TemplateService } from "@/application/services/template-service";

describe("Check Imports", () => {
    it("runs", () => {
        expect(true).toBe(true);
    });
});
