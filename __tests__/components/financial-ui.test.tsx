import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { TransactionTabs } from "@/presentation/financial/components/TransactionTabs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
    useSearchParams: jest.fn(),
}));


describe("Financial UI Components", () => {
    describe("AutocompleteInput", () => {
        it("renders with given value and placeholder", () => {
            const handleChange = jest.fn();
            render(
                <AutocompleteInput
                    value="Banco"
                    onChange={handleChange}
                    options={["Banco Pichincha", "Banco Guayaquil"]}
                    placeholder="Select institution"
                />
            );

            const input = screen.getByPlaceholderText("Select institution");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("Banco");
        });

        it("calls onChange when input changes", () => {
            const handleChange = jest.fn();
            render(
                <AutocompleteInput
                    value=""
                    onChange={handleChange}
                    options={["Banco Pichincha", "Banco Guayaquil"]}
                    placeholder="Select institution"
                />
            );

            const input = screen.getByPlaceholderText("Select institution");
            fireEvent.change(input, { target: { value: "B" } });
            expect(handleChange).toHaveBeenCalledWith("B");
        });

        it("renders the options when focused", () => {
            const handleChange = jest.fn();
            render(
                <AutocompleteInput
                    value=""
                    onChange={handleChange}
                    options={["Banco Pichincha", "Banco Guayaquil"]}
                    placeholder="Select institution"
                />
            );

            const input = screen.getByPlaceholderText("Select institution");
            fireEvent.focus(input);

            expect(screen.getByText("Banco Pichincha")).toBeInTheDocument();
            expect(screen.getByText("Banco Guayaquil")).toBeInTheDocument();
        });
    });

    describe("TransactionTabs", () => {
        const mockPush = jest.fn();

        beforeEach(() => {
            jest.clearAllMocks();
            (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
            (usePathname as jest.Mock).mockReturnValue("/financial/transactions");
            (useSearchParams as jest.Mock).mockReturnValue({
                get: jest.fn(),
                toString: jest.fn().mockReturnValue(""),
            });
        });

        it("renders all tab options", () => {
            render(<TransactionTabs />);
            
            expect(screen.getByText("Todos")).toBeInTheDocument();
            expect(screen.getByText("Gastos")).toBeInTheDocument();
            expect(screen.getByText("Ingresos")).toBeInTheDocument();
            expect(screen.getByText("Transferencias")).toBeInTheDocument();
        });

        it("updates the URL when a tab is clicked", () => {
            render(<TransactionTabs />);
            
            const incomeTab = screen.getByText("Ingresos");
            fireEvent.click(incomeTab.closest("button")!);

            expect(mockPush).toHaveBeenCalledWith("/financial/transactions?type=INCOME");
        });

        it("appends to the URL when multiple tabs are clicked", () => {
            (useSearchParams as jest.Mock).mockReturnValue({
                get: jest.fn().mockReturnValue("EXPENSE"),
                toString: jest.fn().mockReturnValue("type=EXPENSE"),
            });

            render(<TransactionTabs />);
            
            const incomeTab = screen.getByText("Ingresos");
            fireEvent.click(incomeTab.closest("button")!);

            expect(mockPush).toHaveBeenCalledWith("/financial/transactions?type=EXPENSE%2CINCOME");
        });

        it("removes the type param when 'Todos' is clicked", () => {
            (useSearchParams as jest.Mock).mockReturnValue({
                get: jest.fn().mockReturnValue("EXPENSE"),
                toString: jest.fn().mockReturnValue("type=EXPENSE"),
            });

            render(<TransactionTabs />);
            
            const allTab = screen.getByText("Todos");
            // Click the span's parent button which has the data-value
            fireEvent.click(allTab.closest("button")!);

            expect(mockPush).toHaveBeenCalledWith("/financial/transactions?");
        });
        
        it("renders children directly", () => {
            render(
                <TransactionTabs>
                    <div data-testid="tab-child">Child Content</div>
                </TransactionTabs>
            );

            const children = screen.getAllByTestId("tab-child");
            expect(children.length).toBe(1);
        });
    });
});
