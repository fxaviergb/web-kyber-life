"use client";

import { Shield, AlertTriangle, Clock } from "lucide-react";

interface SessionExpiryModalProps {
    secondsRemaining: number;
    onExtend: () => void;
    onLogout: () => void;
}

/**
 * SessionExpiryModal
 *
 * Warning modal shown 30 seconds before automatic logout due to inactivity.
 * Uses KyberLife design tokens and Tailwind CSS.
 * Rendered as a full-screen overlay portal; the parent Provider mounts it
 * conditionally when the grace period starts.
 */
export function SessionExpiryModal({
    secondsRemaining,
    onExtend,
    onLogout,
}: SessionExpiryModalProps) {
    const isUrgent = secondsRemaining <= 10;

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="session-expiry-title"
            aria-describedby="session-expiry-desc"
        >
            {/* Card */}
            <div
                className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
                style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-base)",
                    boxShadow: "var(--shadow-xl), 0 0 40px rgba(99,102,241,0.15)",
                }}
            >
                {/* Top accent bar */}
                <div
                    className="h-1 w-full"
                    style={{
                        background: isUrgent
                            ? "linear-gradient(90deg, var(--accent-danger), #f97316)"
                            : "linear-gradient(90deg, var(--accent-primary), var(--accent-info))",
                    }}
                />

                <div className="p-6 sm:p-8">
                    {/* Icon + Title */}
                    <div className="flex items-start gap-4 mb-5">
                        <div
                            className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
                            style={{
                                background: isUrgent
                                    ? "var(--danger-bg)"
                                    : "rgba(99,102,241,0.12)",
                            }}
                        >
                            {isUrgent ? (
                                <AlertTriangle
                                    className="w-6 h-6"
                                    style={{ color: "var(--accent-danger)" }}
                                />
                            ) : (
                                <Shield
                                    className="w-6 h-6"
                                    style={{ color: "var(--accent-primary)" }}
                                />
                            )}
                        </div>
                        <div>
                            <h2
                                id="session-expiry-title"
                                className="text-lg font-semibold leading-tight"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Tu sesión en KyberLife está por expirar
                            </h2>
                            <p
                                id="session-expiry-desc"
                                className="text-sm mt-1"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                Por seguridad, cerramos sesiones inactivas automáticamente.
                            </p>
                        </div>
                    </div>

                    {/* Countdown */}
                    <div
                        className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6"
                        style={{ background: isUrgent ? "var(--danger-bg)" : "var(--bg-tertiary)" }}
                    >
                        <Clock
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: isUrgent ? "var(--accent-danger)" : "var(--text-tertiary)" }}
                        />
                        <p
                            className="text-sm"
                            style={{ color: isUrgent ? "var(--accent-danger)" : "var(--text-secondary)" }}
                        >
                            Se cerrará la sesión en{" "}
                            <span className="font-bold tabular-nums">
                                {secondsRemaining}
                            </span>{" "}
                            segundo{secondsRemaining !== 1 ? "s" : ""}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onExtend}
                            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2"
                            style={{
                                background: "var(--accent-primary)",
                                color: "#fff",
                                // hover handled via CSS :hover not easily inlined, using Tailwind opacity trick
                            }}
                            onMouseOver={(e) =>
                                (e.currentTarget.style.background = "var(--accent-primary-hover)")
                            }
                            onMouseOut={(e) =>
                                (e.currentTarget.style.background = "var(--accent-primary)")
                            }
                        >
                            Extender sesión
                        </button>
                        <button
                            onClick={onLogout}
                            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2"
                            style={{
                                background: "var(--bg-tertiary)",
                                color: "var(--text-secondary)",
                                border: "1px solid var(--border-base)",
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = "var(--bg-hover)";
                                e.currentTarget.style.color = "var(--text-primary)";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = "var(--bg-tertiary)";
                                e.currentTarget.style.color = "var(--text-secondary)";
                            }}
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
