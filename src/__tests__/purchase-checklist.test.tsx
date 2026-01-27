import { render, screen, fireEvent } from "@testing-library/react";
import { PurchaseChecklist } from "@/presentation/components/purchase/PurchaseChecklist";
import { Purchase, PurchaseLine, Unit } from "@/domain/entities";

// Mock Server Actions
jest.mock("@/app/actions/purchase", () => ({
    updateLineJsonAction: jest.fn().mockResolvedValue({ success: true }),
    finishPurchaseAction: jest.fn().mockResolvedValue({ success: true }),
}));

describe("PurchaseChecklist", () => {
    const mockPurchase: Purchase = {
        id: "p1",
        ownerUserId: "u1",
        supermarketId: "s1",
        date: "2024-01-01",
        currencyCode: "USD",
        selectedTemplateIds: [],
        totalPaid: null,
        status: "draft",
        createdAt: "",
        updatedAt: "",
        isDeleted: false
    };

    const mockLines: PurchaseLine[] = [
        {
            id: "l1",
            purchaseId: "p1",
            genericItemId: "g1",
            brandProductId: null,
            qty: 1,
            unitId: "u1",
            unitPrice: 10,
            checked: false,
            lineAmountOverride: null,
            note: null
        }
    ];

    const mockUnits: Unit[] = [{ id: "u1", ownerUserId: "u1", name: "Unit", symbol: "u", createdAt: "", updatedAt: "", isDeleted: false }];
    const mockBrandMap = { "g1": [] };
    const mockNamesMap = { "g1": "Test Item" };

    it("should render items correctly", () => {
        render(
            <PurchaseChecklist
                purchase={mockPurchase}
                initialLines={mockLines}
                brandOptionsMap={mockBrandMap}
                units={mockUnits}
                itemNamesMap={mockNamesMap}
            />
        );
        expect(screen.getByText("Test Item")).toBeInTheDocument();
        expect(screen.getByText("Total Estimado")).toBeInTheDocument();
        expect(screen.getByText("$10.00")).toBeInTheDocument();
    });

    it("should toggle check status", () => {
        render(
            <PurchaseChecklist
                purchase={mockPurchase}
                initialLines={mockLines}
                brandOptionsMap={mockBrandMap}
                units={mockUnits}
                itemNamesMap={mockNamesMap}
            />
        );

        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);
        // Expect optimistic update visually? 
        // We can check if `updateLineJsonAction` was called.
        const { updateLineJsonAction } = require("@/app/actions/purchase");
        expect(updateLineJsonAction).toHaveBeenCalledWith("l1", { checked: true });
    });
});
