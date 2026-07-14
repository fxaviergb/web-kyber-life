"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = "input, textarea, select";

/**
 * Keeps whichever field currently has focus visible above the on-screen
 * keyboard on mobile. Attaches once to a container (via event delegation, so
 * it covers every current and future field inside it — including ones
 * rendered by nested components) and:
 *
 * - Scrolls the focused field into view shortly after it's focused.
 * - Re-scrolls once the keyboard finishes animating in, detected via the
 *   Visual Viewport API shrinking (the `focus` event fires before the
 *   keyboard is fully open, so an immediate scroll can land short).
 *
 * Nothing runs when the keyboard hides — the page's normal layout already
 * puts the field back where it was.
 */
export function useScrollFieldIntoView(containerRef: RefObject<HTMLElement | null>) {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let focused: HTMLElement | null = null;

        const scrollFocusedIntoView = () => {
            focused?.scrollIntoView({ block: "center", behavior: "smooth" });
        };

        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target;
            if (!(target instanceof HTMLElement) || !target.matches(FOCUSABLE_SELECTOR)) return;
            focused = target;
            // Give the keyboard a moment to start animating in before the first attempt.
            setTimeout(scrollFocusedIntoView, 50);
        };

        const handleFocusOut = () => {
            focused = null;
        };

        const handleViewportResize = () => {
            if (!focused) return;
            const viewport = window.visualViewport;
            // Only the keyboard opening shrinks the visual viewport below the layout viewport.
            if (viewport && viewport.height < window.innerHeight) {
                scrollFocusedIntoView();
            }
        };

        container.addEventListener("focusin", handleFocusIn);
        container.addEventListener("focusout", handleFocusOut);
        window.visualViewport?.addEventListener("resize", handleViewportResize);

        return () => {
            container.removeEventListener("focusin", handleFocusIn);
            container.removeEventListener("focusout", handleFocusOut);
            window.visualViewport?.removeEventListener("resize", handleViewportResize);
        };
    }, [containerRef]);
}
