"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

/**
 * Client-only ThemeProvider wrapper that prevents hydration mismatches.
 * 
 * next-themes v0.4.6 injects a <script> via dangerouslySetInnerHTML that
 * causes SSR/client HTML divergence in React 19 + Next.js 16. By deferring
 * rendering until after mount, we avoid the hydration mismatch entirely.
 * 
 * `disableTransitionOnChange` is intentionally omitted because it creates/removes
 * <style> nodes in document.head, and React 19 StrictMode double-invokes effects
 * causing "removeChild" errors when the node is already gone.
 */
export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Render children without theme provider during SSR to avoid mismatch.
        // The html tag already has suppressHydrationWarning for the class attr.
        return <>{children}</>;
    }

    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            {...props}
        >
            {children}
        </NextThemesProvider>
    );
}
