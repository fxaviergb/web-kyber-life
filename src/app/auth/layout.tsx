import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-bg-primary transition-colors duration-300 relative">
            {/* Theme Toggle - Top Right */}
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle className="text-text-primary hover:bg-bg-hover" />
            </div>

            {/* Main Content */}
            <div className="w-full max-w-[400px] p-4">
                {children}
            </div>
        </div>
    );
}
