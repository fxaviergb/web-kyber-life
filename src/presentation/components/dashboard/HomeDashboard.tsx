"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Wallet, ShoppingCart, Receipt, ArrowRight, Plus, Layers, Package, CalendarRange, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { computeDateRange, defaultHubCustomRange, type RangeFilterType } from "@/lib/date-range";
import { DateRangeFilter, HUB_PRESETS } from "@/presentation/components/charts/DateRangeFilter";
import { RankBarChart } from "@/presentation/components/charts/RankBarChart";
import { SpendTrendChart } from "@/presentation/components/charts/SpendTrendChart";
import { UnifiedTrendChart } from "@/presentation/financial/components/UnifiedTrendChart";
import { useHomeDashboard } from "./hooks/useHomeDashboard";

function ChartSkeleton() {
    return <div className="h-[440px] rounded-2xl border border-border-base bg-bg-secondary animate-pulse" />;
}

interface ModuleSectionProps {
    icon: ReactNode;
    iconWrapClassName: string;
    title: string;
    subtitle: string;
    actions: ReactNode;
    children: ReactNode;
}

function ModuleSection({ icon, iconWrapClassName, title, subtitle, actions, children }: ModuleSectionProps) {
    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg", iconWrapClassName)}>
                        {icon}
                    </span>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-text-primary">{title}</h2>
                        <p className="text-sm text-text-tertiary">{subtitle}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">{actions}</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">{children}</div>
        </section>
    );
}

export function HomeDashboard({ userFirstName }: { userFirstName?: string }) {
    const initialCustom = useMemo(() => defaultHubCustomRange(), []);
    const [filterType, setFilterType] = useState<RangeFilterType>("all");
    const [customStart, setCustomStart] = useState(initialCustom.start);
    const [customEnd, setCustomEnd] = useState(initialCustom.end);
    const [filterOpen, setFilterOpen] = useState(false);
    const [categoryLimit, setCategoryLimit] = useState(5);
    const [productLimit, setProductLimit] = useState(5);

    const { startDate, endDate } = useMemo(
        () => computeDateRange(filterType, customStart, customEnd),
        [filterType, customStart, customEnd],
    );

    const { data, loading } = useHomeDashboard(startDate, endDate);

    const financialCategoryData = useMemo(
        () =>
            data.financialCategories
                .filter((c) => c.categoryName && c.categoryName.toLowerCase() !== "sin categoría")
                .slice(0, categoryLimit)
                .map((c) => ({ name: c.categoryName, value: c.total, color: c.color, percentage: c.percentage })),
        [data.financialCategories, categoryLimit],
    );

    const presetLabel = HUB_PRESETS.find((p) => p.id === filterType)?.label ?? "Todos";

    const marketTopProductData = useMemo(
        () => data.marketTopProducts.slice(0, productLimit).map((p) => ({ name: p.name, value: p.value })),
        [data.marketTopProducts, productLimit],
    );

    // Stable denominator for product shares: the full fetched top-products set,
    // so percentages don't shift when toggling between Top 5 and Top 10.
    const marketProductsTotal = useMemo(
        () => data.marketTopProducts.reduce((sum, p) => sum + p.value, 0),
        [data.marketTopProducts],
    );

    const greeting = userFirstName ? `Hola, ${userFirstName}` : "Panel general";

    return (
        <div className="space-y-8 pb-12">
            {/* Hero + shared range filter */}
            <header className="relative overflow-hidden rounded-3xl border border-border-base bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-tertiary/40 p-6 sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-accent-primary/10 blur-3xl" />
                <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-accent-info/10 blur-3xl" />
                <div className="relative flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs font-semibold uppercase tracking-widest text-accent-primary">KyberLife</p>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">{greeting}</h1>
                        <p className="text-text-tertiary text-sm">Tu actividad financiera y de compras, en un vistazo.</p>
                    </div>
                    {/* Mobile: accordion filter card */}
                    <div className="lg:hidden">
                        <button
                            type="button"
                            onClick={() => setFilterOpen((o) => !o)}
                            aria-expanded={filterOpen}
                            className={cn(
                                "relative w-full flex items-center justify-between py-3 px-4 rounded-[1.25rem] border border-border/50 dark:border-white/10 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.04] to-transparent shadow-lg shadow-black/5 dark:shadow-black/20 transition-all active:scale-[0.98]",
                                filterOpen
                                    ? "bg-black/[0.02] dark:bg-white/[0.02] border-border dark:border-white/15"
                                    : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                            )}
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent rounded-t-[1.25rem]" aria-hidden="true" />
                            <div className="flex items-center gap-3 relative z-10 min-w-0">
                                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-inner shrink-0">
                                    <Filter className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col justify-center gap-1.5 min-w-0 text-left">
                                    <span className="text-lg font-bold tracking-tight leading-none text-foreground/90">
                                        Filtros
                                    </span>
                                    <p className="text-[10px] text-muted-foreground font-medium leading-none uppercase tracking-wider truncate">
                                        Período: {presetLabel}
                                    </p>
                                </div>
                            </div>
                            <div className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 border border-border/50 dark:border-white/10 shadow-sm shrink-0">
                                <ChevronDown className={cn("w-4 h-4 text-foreground/70 transition-transform duration-300", filterOpen && "rotate-180")} />
                            </div>
                        </button>
                        {filterOpen && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                <DateRangeFilter
                                    value={filterType}
                                    onChange={setFilterType}
                                    customStart={customStart}
                                    customEnd={customEnd}
                                    onCustomStartChange={setCustomStart}
                                    onCustomEndChange={setCustomEnd}
                                    presets={HUB_PRESETS}
                                />
                            </div>
                        )}
                    </div>

                    {/* Desktop: inline filter */}
                    <div className="hidden lg:flex lg:items-center lg:gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary shrink-0">
                            <CalendarRange className="h-4 w-4" />
                            <span className="uppercase tracking-wide">Período</span>
                        </div>
                        <DateRangeFilter
                            value={filterType}
                            onChange={setFilterType}
                            customStart={customStart}
                            customEnd={customEnd}
                            onCustomStartChange={setCustomStart}
                            onCustomEndChange={setCustomEnd}
                            presets={HUB_PRESETS}
                        />
                    </div>
                </div>
            </header>

            {/* ── Financiero ── */}
            <ModuleSection
                icon={<Wallet className="h-5 w-5" />}
                iconWrapClassName="bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/20"
                title="Finanzas"
                subtitle="Ingresos, gastos y categorías de tu dinero."
                actions={
                    <>
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                            <Link href="/financial/transactions">
                                <Receipt className="mr-2 h-4 w-4" />
                                Transacciones
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="rounded-full bg-accent-primary hover:bg-accent-primary/90 text-white shadow-lg shadow-accent-primary/20">
                            <Link href="/financial">
                                Ver panel
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </>
                }
            >
                {loading ? (
                    <>
                        <ChartSkeleton />
                        <ChartSkeleton />
                    </>
                ) : (
                    <>
                        <UnifiedTrendChart data={data.financialDaily} iconLegend />
                        <RankBarChart
                            title="Gasto por categoría"
                            description="Distribución de tus gastos"
                            icon={Layers}
                            iconClassName="text-emerald-500"
                            data={financialCategoryData}
                            emptyMessage="Sin gastos por categoría en el período"
                            showPercentage
                            headerAction={
                                <Select value={String(categoryLimit)} onValueChange={(v) => setCategoryLimit(Number(v))}>
                                    <SelectTrigger className="w-[92px] h-8 text-xs bg-muted/40 border-border/40 rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">Top 5</SelectItem>
                                        <SelectItem value="10">Top 10</SelectItem>
                                    </SelectContent>
                                </Select>
                            }
                        />
                    </>
                )}
            </ModuleSection>

            {/* ── Market ── */}
            <ModuleSection
                icon={<ShoppingCart className="h-5 w-5" />}
                iconWrapClassName="bg-gradient-to-br from-accent-violet to-accent-cyan shadow-accent-violet/20"
                title="Market"
                subtitle="Tu gasto en compras y los productos que más consumes."
                actions={
                    <>
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                            <Link href="/market/analytics">
                                Ver panel
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="rounded-full bg-accent-primary hover:bg-accent-primary/90 text-white shadow-lg shadow-accent-primary/20">
                            <Link href="/market/purchases/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva compra
                            </Link>
                        </Button>
                    </>
                }
            >
                {loading ? (
                    <>
                        <ChartSkeleton />
                        <ChartSkeleton />
                    </>
                ) : (
                    <>
                        <SpendTrendChart
                            data={data.marketDaily}
                            title="Gasto en compras"
                            description="Evolución de tu gasto en Market"
                            icon={ShoppingCart}
                            iconClassName="text-accent-violet"
                            color="#8b5cf6"
                        />
                        <RankBarChart
                            title="Productos top"
                            description="Mayor gasto por producto"
                            icon={Package}
                            iconClassName="text-accent-violet"
                            data={marketTopProductData}
                            emptyMessage="Sin compras en el período"
                            showPercentage
                            total={marketProductsTotal}
                            headerAction={
                                <Select value={String(productLimit)} onValueChange={(v) => setProductLimit(Number(v))}>
                                    <SelectTrigger className="w-[92px] h-8 text-xs bg-muted/40 border-border/40 rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">Top 5</SelectItem>
                                        <SelectItem value="10">Top 10</SelectItem>
                                    </SelectContent>
                                </Select>
                            }
                        />
                    </>
                )}
            </ModuleSection>
        </div>
    );
}
