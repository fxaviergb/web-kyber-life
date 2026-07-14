import {
    Building2, CreditCard, ShoppingCart, ArrowRightLeft,
    PiggyBank, Utensils, Landmark, Scissors, GraduationCap, Ticket, FileText, Dog, HelpCircle,
    Gift, Shirt, Banknote, HeartPulse, ShieldCheck, Lightbulb, Repeat, Car, Plane, Home,
    Wallet, Pill, Fuel, Dumbbell, User, Wifi, UtensilsCrossed, Laptop, Store,
    type LucideIcon,
} from "lucide-react";

/** Shared lucide icon resolver for financial category and institution-type icon names. */
export const FINANCIAL_ICONS: Record<string, LucideIcon> = {
    // Category icons
    PiggyBank, Utensils, Landmark, Scissors, GraduationCap, Ticket, FileText, Dog, HelpCircle,
    CreditCard, Gift, Shirt, Banknote, HeartPulse, ShieldCheck, Lightbulb, ShoppingCart, Repeat,
    ArrowRightLeft, Car, Plane, Home,
    // Institution-type icons
    Wallet, Pill, Fuel, Dumbbell, Building2, User, Wifi, UtensilsCrossed, Laptop, Store,
};

/** Resolve an icon name (as stored on a category/institution-type) to its component, with a fallback. */
export function resolveFinancialIcon(name: string | null | undefined, fallback: LucideIcon): LucideIcon {
    return (name && FINANCIAL_ICONS[name]) || fallback;
}
