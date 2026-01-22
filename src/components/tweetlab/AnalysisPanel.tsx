"use client";

import { Info, ChevronLeft, ChevronRight, Sparkles, RefreshCw, Copy, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { TweetAnalysis, TweetSuggestion } from "@/lib/types";
import { useState } from "react";
import { SuperXPromo } from "./SuperXPromo";
//
interface AnalysisPanelProps {
    analysis: TweetAnalysis | null;
    isLoading: boolean;
    onRegenerate?: (instruction?: string) => void;
    isRegenerating?: boolean;
    onVariantClick?: (idx: number) => void;
    selectedVariantIdx?: number | null; // For visual feedback on selected variant
    showModelWarning?: boolean; // Show warning when using smaller model
    premiumRemaining?: number; // How many premium queries left
}

export function AnalysisPanel({ analysis, isLoading, onRegenerate, isRegenerating, onVariantClick, selectedVariantIdx, showModelWarning, premiumRemaining }: AnalysisPanelProps) {
    const [variantPage, setVariantPage] = useState(0);
    const [instruction, setInstruction] = useState("");
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const variantsPerPage = 4;

    // Calculate engagement score using X algorithm weights
    // Replies are 75x more valuable than likes, bookmarks 50x
    const getEngagementScore = () => {
        if (!analysis) return 0;
        const likes = analysis.predicted_likes || 0;
        const retweets = analysis.predicted_retweets || 0;
        const replies = analysis.predicted_replies || 0;
        const views = analysis.predicted_views || 1;

        // X algorithm weighted engagement
        // Replies: 75x, Retweets: 20x, Likes: 1x, normalized by views
        const weightedEngagement = (replies * 75) + (retweets * 20) + likes;
        const engagementRate = (weightedEngagement / views) * 100;

        // Normalize to 0-100 scale
        const score = Math.min(100, Math.round(engagementRate));
        return Math.max(5, score); // Minimum score of 5
    };

    // Calculate variant score based on version type boost
    const getVariantScore = (baseScore: number, version: string, idx: number) => {
        // Each variant type adds a different boost
        const boosts: Record<string, number> = {
            "Curiosity": 15,
            "Authority": 12,
            "Controversy": 18,
        };
        const boost = boosts[version] || 10;
        return Math.min(99, baseScore + boost - (idx * 2));
    };

    const getScoreLabel = (score: number) => {
        if (score >= 70) return "Excellent";
        if (score >= 50) return "Good";
        if (score >= 30) return "Average";
        return "Needs Work";
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return "text-green-500";
        if (score >= 50) return "text-amber-500";
        if (score >= 30) return "text-yellow-500";
        return "text-red-500";
    };

    const score = getEngagementScore();
    const variants = analysis?.suggestions || [];
    const totalPages = Math.ceil(variants.length / variantsPerPage);
    const currentVariants = variants.slice(
        variantPage * variantsPerPage,
        (variantPage + 1) * variantsPerPage
    );

    const handleCopy = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const handleGenerate = () => {
        if (onRegenerate) {
            onRegenerate(instruction.trim() || undefined);
            setInstruction("");
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 flex flex-col gap-4 no-scrollbar pb-4">
                {/* Loading State */}
                {isLoading && (
                    <div className="border border-border rounded-2xl overflow-hidden bg-card p-6 shrink-0">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 blur-2xl opacity-40 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full animate-pulse" />
                                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/20">
                                    <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-2">AI Simulating Users...</h3>
                            <p className="text-[13px] text-muted-foreground mb-4">
                                Analyzing engagement patterns and predicting reactions
                            </p>
                            <div className="flex gap-2">
                                <div className="px-3 py-1.5 bg-secondary rounded-full text-[12px] animate-pulse">
                                    🧠 Analyzing hook...
                                </div>
                                <div className="px-3 py-1.5 bg-secondary rounded-full text-[12px] animate-pulse" style={{ animationDelay: "200ms" }}>
                                    📊 Predicting reach
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Model Tier Warning */}
                {showModelWarning && !isLoading && (
                    <a
                        href="https://superx.so/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors shrink-0 group"
                    >
                        <div className="p-1.5 rounded-lg bg-amber-500/10 shrink-0">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-foreground font-medium leading-snug">
                                Premium queries used up
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                Now using a smaller model. Get SuperX for unlimited premium AI.
                            </p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    </a>
                )}

                {/* Engagement Score Card */}
                {!isLoading && (
                    <div className="border border-border rounded-2xl overflow-hidden bg-card shrink-0">
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-medium text-[15px] text-muted-foreground">Engagement Score</h2>
                                <button className="p-1 hover:bg-secondary rounded-full transition-colors" title="Based on X algorithm factors: replies (75x), retweets (20x), likes">
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="flex items-baseline justify-between mb-3">
                                <span className={`text-lg font-semibold ${analysis ? getScoreColor(score) : 'text-muted-foreground'}`}>
                                    {analysis ? getScoreLabel(score) : 'Waiting...'}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">{analysis ? score : '--'}</span>
                                    <span className="text-muted-foreground text-lg">/ 100</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: analysis ? `${score}%` : '0%' }}
                                />
                            </div>

                            {!analysis && (
                                <p className="text-muted-foreground mt-4 text-[13px]">
                                    Post a tweet to see its predicted performance.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Variants Section */}
                {!isLoading && variants.length > 0 && (
                    <div className="border border-border rounded-2xl overflow-hidden bg-card shrink-0">
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-medium text-[15px]">Variants</h2>
                                    <button className="p-1 hover:bg-secondary rounded-full transition-colors" title="AI-generated optimizations">
                                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <button
                                            onClick={() => setVariantPage(p => Math.max(0, p - 1))}
                                            disabled={variantPage === 0}
                                            className="p-1 hover:bg-secondary rounded disabled:opacity-30"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <span>{variantPage + 1} / {totalPages}</span>
                                        <button
                                            onClick={() => setVariantPage(p => Math.min(totalPages - 1, p + 1))}
                                            disabled={variantPage === totalPages - 1}
                                            className="p-1 hover:bg-secondary rounded disabled:opacity-30"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                {/* Original Tweet */}
                                <div className="flex items-center justify-between gap-3 p-3 bg-secondary/50 rounded-xl border border-border/50">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold mb-0.5">Original</p>
                                        <p className="text-[12px] text-muted-foreground truncate">
                                            {analysis?.tweet.substring(0, 35) || 'Your original tweet'}...
                                        </p>
                                    </div>
                                    <span className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</span>
                                </div>

                                {/* Variant Tweets */}
                                {currentVariants.map((suggestion, i) => {
                                    const variantScore = getVariantScore(score, suggestion.version, i);
                                    const globalIdx = variantPage * variantsPerPage + i;
                                    const isSelected = selectedVariantIdx === globalIdx;

                                    return (
                                        <div
                                            key={i}
                                            className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-all duration-150 cursor-pointer group ${isSelected ? 'bg-amber-500/10 ring-2 ring-amber-500/50 scale-[1.02]' : 'hover:bg-secondary/30'}`}
                                            onClick={() => {
                                                if (onVariantClick) onVariantClick(globalIdx);
                                            }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-[13px] font-semibold">{suggestion.version}</p>
                                                    <span className="text-[10px] text-green-500 font-medium">
                                                        +{variantScore - score}%
                                                    </span>
                                                </div>
                                                <p className="text-[12px] text-muted-foreground truncate">
                                                    {suggestion.tweet.substring(0, 35)}...
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xl font-bold ${getScoreColor(variantScore)}`}>
                                                    {variantScore}
                                                </span>
                                                <button
                                                    className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary rounded"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopy(suggestion.tweet, globalIdx);
                                                    }}
                                                >
                                                    {copiedIdx === globalIdx ? (
                                                        <Check size={14} className="text-green-500" />
                                                    ) : (
                                                        <Copy size={14} className="text-muted-foreground" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Generate Button */}
                            <div className="mt-4 pt-4 border-t border-border">
                                <input
                                    type="text"
                                    value={instruction}
                                    onChange={(e) => setInstruction(e.target.value)}
                                    placeholder="Add instructions... (optional)"
                                    className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 mb-3"
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                />
                                <button
                                    onClick={handleGenerate}
                                    disabled={isRegenerating || !analysis}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-semibold text-[14px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isRegenerating ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            Generate New Variants
                                            <RefreshCw className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Insights Section */}
                {!isLoading && analysis && (
                    <div className="border border-border rounded-2xl overflow-hidden bg-card shrink-0">
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="font-medium text-[15px]">AI Analysis</h2>
                                <button className="p-1 hover:bg-secondary rounded-full transition-colors">
                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Engagement Justification */}
                            <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">
                                {analysis.engagement_justification}
                            </p>

                            {/* Analysis Points */}
                            {analysis.analysis && analysis.analysis.length > 0 && (
                                <div className="space-y-2">
                                    {analysis.analysis.map((point, i) => (
                                        <div key={i} className="flex items-start gap-2 text-[13px]">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            <span className="text-muted-foreground">{point}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* SuperX Promo - Fixed at bottom */}
            <div className="mt-auto pt-2 shrink-0 bg-background/95 backdrop-blur-sm z-10 pb-0">
                <SuperXPromo compact={!!analysis} />
            </div>
        </div>
    );
}
