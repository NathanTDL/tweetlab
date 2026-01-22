import { ExternalLink, BarChart3, Users, Zap, ArrowRight } from "lucide-react";

interface SuperXPromoProps {
    compact?: boolean;
}

export function SuperXPromo({ compact = false }: SuperXPromoProps) {
    if (compact) {
        // Compact version for when analysis is present
        return (
            <a
                href="https://superx.so/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-gradient-to-r from-card to-amber-950/10 hover:border-amber-500/30 transition-all duration-300 group"
            >
                {/* Logo */}
                <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                    <span className="text-xl">🔥</span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] leading-tight group-hover:text-amber-500 transition-colors">
                        SuperX
                    </h3>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                        Grow faster on 𝕏 with AI analytics
                    </p>
                </div>

                {/* Arrow */}
                <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 group-hover:from-amber-500/20 group-hover:to-yellow-500/20 transition-colors shrink-0">
                    <ArrowRight size={16} className="text-amber-500" />
                </div>
            </a>
        );
    }

    // Full version (original)
    return (
        <a
            href="https://superx.so/"
            target="_blank"
            rel="noopener noreferrer"
            className="block group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-amber-950/10 hover:border-amber-500/30 transition-all duration-300"
        >
            {/* Subtle Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="p-6 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                        {/* Logo */}
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <span className="text-2xl">🔥</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight group-hover:text-amber-500 transition-colors">SuperX</h3>
                            <p className="text-[12px] text-muted-foreground font-medium">Analytics & Growth Platform</p>
                        </div>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/50 group-hover:bg-amber-500/10 transition-colors">
                        <ExternalLink size={16} className="text-muted-foreground group-hover:text-amber-500 transition-colors" />
                    </div>
                </div>

                {/* Tagline */}
                <h4 className="font-bold text-xl mb-3 text-foreground">
                    Grow faster on 𝕏
                </h4>

                <p className="text-[14px] text-muted-foreground leading-relaxed mb-5">
                    Unlock hidden insights, understand your audience deeply, and accelerate your growth with AI-powered analytics.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border/50">
                        <BarChart3 size={18} className="text-amber-500" />
                        <span className="text-[11px] font-medium text-muted-foreground text-center">Smart Analytics</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border/50">
                        <Users size={18} className="text-amber-500" />
                        <span className="text-[11px] font-medium text-muted-foreground text-center">Audience DNA</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border/50">
                        <Zap size={18} className="text-amber-500" />
                        <span className="text-[11px] font-medium text-muted-foreground text-center">Growth AI</span>
                    </div>
                </div>

                {/* CTA Button */}
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/30">
                    Get Started Free
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Trust Badge */}
                <p className="mt-4 text-center text-[11px] text-muted-foreground">
                    Trusted by 10,000+ creators worldwide
                </p>
            </div>
        </a>
    );
}
