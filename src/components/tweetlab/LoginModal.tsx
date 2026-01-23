"use client";

import { X, FlaskConical } from "lucide-react";
import Image from "next/image";
import { signIn } from "@/lib/auth-client";
import { useState } from "react";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleXSignIn = async () => {
        setIsLoading(true);
        try {
            await signIn.social({
                provider: "twitter",
                callbackURL: "/",
            });
        } catch (error) {
            console.error("Sign in error:", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative z-10 w-full max-w-[400px] mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-xl shadow-2xl">
                    {/* Decorative gradient orb */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors z-10"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Content */}
                    <div className="relative px-8 py-12 flex flex-col items-center text-center">
                        {/* Logo */}
                        <div className="relative w-16 h-16 mb-6 flex items-center justify-center">
                            <FlaskConical className="w-16 h-16 text-yellow-500" strokeWidth={2} />
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold mb-2 tracking-tight">
                            Welcome to PostLab
                        </h2>

                        {/* Subtitle */}
                        <p className="text-muted-foreground mb-8 max-w-[280px]">
                            Sign in with X to save your tweet simulations and track your content performance over time.
                        </p>

                        {/* X (Twitter) Sign In Button */}
                        <button
                            onClick={handleXSignIn}
                            disabled={isLoading}
                            className="group relative w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-full bg-black text-white font-semibold text-[15px] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 border border-white/10"
                        >
                            {/* X Icon */}
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>

                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                "Continue with X"
                            )}

                            {/* Subtle gradient overlay on hover */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                        </button>

                        {/* Terms text */}
                        <p className="mt-6 text-xs text-muted-foreground/70 max-w-[260px]">
                            By continuing, you agree to PostLab&apos;s Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
