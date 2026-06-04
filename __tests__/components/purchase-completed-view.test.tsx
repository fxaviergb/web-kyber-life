import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PurchaseCompletedView } from "@/presentation/components/purchase/PurchaseCompletedView";
import { Purchase, PurchaseLine, Unit, GenericItem } from "@/domain/entities";
import { updatePurchaseAction, updateLineJsonAction } from "@/app/actions/purchase";

jest.mock("@/app/actions/purchase", () => ({
    deletePurchaseAction: jest.fn().mockResolvedValue({ success: true }),
    updatePurchaseAction: jest.fn().mockResolvedValue({ success: true }),
    updateLineJsonAction: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn(), refresh: jest.fn() })
}));

jest.mock("lucide-react", () => ({
    Trash2: () => <div data-testid="icon-trash" />,
    ArrowLeft: () => <div data-testid="icon-arrow-left" />,
    Edit2: () => <div data-testid="icon-edit" className="lucide-edit2" />,
    Plus: () => <div data-testid="icon-plus" />
}));

// Mock ResizeObserver for radix-ui dialogs
class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
window.ResizeObserver = ResizeObserver;
window.HTMLElement.prototype.hasPointerCapture = jest.fn();
window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock("@/components/ui/alert-dialog", () => ({
    AlertDialog: ({ children }: any) => <div>{children}</div>,
    AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
    AlertDialogContent: ({ children }: any) => <div>{children}</div>,
    AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
    AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
    AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
    AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
    AlertDialogTrigger: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/responsive-dialog", () => ({
    ResponsiveDialog: ({ children, open, onOpenChange }: any) => open ? <div>{children}</div> : null,
    ResponsiveDialogContent: ({ children }: any) => <div>{children}</div>,
    ResponsiveDialogHeader: ({ children }: any) => <div>{children}</div>,
    ResponsiveDialogTitle: ({ children }: any) => <div>{children}</div>,
    ResponsiveDialogFooter: ({ children }: any) => <div>{children}</div>,
}));

describe("PurchaseCompletedView Integration Test", () => {
    const mockPurchase: Purchase = {
        id: "p1",
        ownerUserId: "u1",
        supermarketId: "s1",
        date: "2024-01-01",
        currencyCode: "USD",
        selectedTemplateIds: [],
        totalPaid: 100,
        subtotal: 90,
        tax: 10,
        discount: 0,
        status: "completed",
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
            qty: 2,
            unitId: "u1",
            unitPrice: 50,
            checked: true,
            lineAmountOverride: null,
            note: null,
            createdAt: "",
            updatedAt: "",
            isDeleted: false
        },
        {
            id: "l2",
            purchaseId: "p1",
            genericItemId: "g2",
            brandProductId: null,
            qty: 1,
            unitId: "u1",
            unitPrice: null,
            checked: false, // Not purchased
            lineAmountOverride: null,
            note: null,
            createdAt: "",
            updatedAt: "",
            isDeleted: false
        }
    ];

    const mockUnits: Unit[] = [{ id: "u1", ownerUserId: "u1", name: "Unit", symbol: "u", createdAt: "", updatedAt: "", isDeleted: false }];
    const mockBrandMap = { "g1": [], "g2": [] };
    const mockGenericItemsMap: Record<string, GenericItem> = {
        "g1": {
            id: "g1",
            ownerUserId: "u1",
            canonicalName: "Item 1",
            aliases: [],
            primaryCategoryId: null,
            secondaryCategoryIds: [],
            imageUrl: null,
            createdAt: "",
            updatedAt: "",
            isDeleted: false,
            globalPrice: null,
            currencyCode: null
        },
        "g2": {
            id: "g2",
            ownerUserId: "u1",
            canonicalName: "Item 2",
            aliases: [],
            primaryCategoryId: null,
            secondaryCategoryIds: [],
            imageUrl: null,
            createdAt: "",
            updatedAt: "",
            isDeleted: false,
            globalPrice: null,
            currencyCode: null
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render correctly", () => {
        render(
            <PurchaseCompletedView
                purchase={mockPurchase}
                lines={mockLines}
                brandOptionsMap={mockBrandMap}
                units={mockUnits}
                genericItemsMap={mockGenericItemsMap}
            />
        );
        expect(screen.getByText("Compra Finalizada")).toBeInTheDocument();
        expect(screen.getByText("Total Pagado")).toBeInTheDocument();
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("should open edit totals dialog and save totals", async () => {
        render(
            <PurchaseCompletedView
                purchase={mockPurchase}
                lines={mockLines}
                brandOptionsMap={mockBrandMap}
                units={mockUnits}
                genericItemsMap={mockGenericItemsMap}
            />
        );

        // Click Edit Totals button
        const editButtons = screen.getAllByRole("button");
        // The first edit button should be the totals edit
        const editTotalsBtn = editButtons.find(b => b.querySelector('svg.lucide-edit2') || b.querySelector('div[data-testid="icon-edit"]'));
        if (editTotalsBtn) {
            fireEvent.click(editTotalsBtn);
        }

        // Dialog should be open
        expect(screen.getByText("Editar Totales")).toBeInTheDocument();

        // Change total paid
        const totalPaidInput = screen.getByLabelText("Total Pagado");
        fireEvent.change(totalPaidInput, { target: { value: "110" } });

        // Save
        const saveBtns = screen.getAllByText("Guardar");
        fireEvent.click(saveBtns[0]); // there might be multiple if other dialogs are mistakenly rendered, but only one is visible

        await waitFor(() => {
            expect(updatePurchaseAction).toHaveBeenCalledWith("p1", expect.objectContaining({
                totalPaid: 110,
                subtotal: 90,
                tax: 10,
                discount: null
            }));
        });
    });

    it("should open edit line dialog and save changes", async () => {
        render(
            <PurchaseCompletedView
                purchase={mockPurchase}
                lines={mockLines}
                brandOptionsMap={mockBrandMap}
                units={mockUnits}
                genericItemsMap={mockGenericItemsMap}
            />
        );

        // Click on "Item 1" to edit it
        const item1 = screen.getByText("Item 1");
        fireEvent.click(item1);

        // Dialog should open
        expect(screen.getByText("Editar Item 1")).toBeInTheDocument();

        // Change qty and price
        const qtyInput = screen.getByLabelText("Cantidad");
        const priceInput = screen.getByLabelText("Precio Unitario");
        
        fireEvent.change(qtyInput, { target: { value: "3" } });
        fireEvent.change(priceInput, { target: { value: "60" } });

        // Save
        const saveBtns = screen.getAllByText("Guardar");
        fireEvent.click(saveBtns[saveBtns.length - 1]); // the last one or the one in the dialog

        await waitFor(() => {
            expect(updateLineJsonAction).toHaveBeenCalledWith("l1", expect.objectContaining({
                qty: 3,
                unitPrice: 60,
                checked: true
            }));
        });
    });
});

