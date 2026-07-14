import React, { useRef } from "react";
import { render, fireEvent } from "@testing-library/react";
import { useScrollFieldIntoView } from "@/hooks/use-scroll-field-into-view";

function TestForm() {
    const ref = useRef<HTMLDivElement>(null);
    useScrollFieldIntoView(ref);
    return (
        <div ref={ref}>
            <input placeholder="text field" />
            <button type="button">not a field</button>
        </div>
    );
}

describe("useScrollFieldIntoView", () => {
    let scrollIntoViewMock: jest.Mock;

    beforeEach(() => {
        scrollIntoViewMock = jest.fn();
        // jsdom doesn't implement scrollIntoView.
        HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("scrolls a focused input/textarea/select into view", () => {
        const { getByPlaceholderText } = render(<TestForm />);

        fireEvent.focusIn(getByPlaceholderText("text field"));
        jest.advanceTimersByTime(100);

        expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
    });

    it("ignores focus on non-field elements like buttons", () => {
        const { getByText } = render(<TestForm />);

        fireEvent.focusIn(getByText("not a field"));
        jest.advanceTimersByTime(100);

        expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });
});
