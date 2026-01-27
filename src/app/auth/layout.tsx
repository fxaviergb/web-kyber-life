export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-bg-2 via-bg-0 to-bg-0">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] pointer-events-none" />
            <div className="w-full max-w-md p-6 relative z-10">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-coral via-accent-magenta to-accent-violet bg-clip-text text-transparent mb-2">
                        KYBER LIFE
                    </h1>
                    <p className="text-text-2">Tu supermercado personal inteligente</p>
                </div>
                {children}
            </div>
        </div>
    );
}
