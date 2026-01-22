"use client";

import { useState, useEffect } from "react";
import { TweetComposer } from "./Composer";
import { TweetCard } from "./TweetCard";
import { SimulationLoader } from "./SimulationLoader";
import { TweetAnalysis, TweetSuggestion } from "@/lib/types";
import { Copy, Check, Home, MessageSquare, Sparkles, HelpCircle, Zap, TrendingUp, MessageCircle, ArrowLeft, Users, X } from "lucide-react";
import { useSession } from "@/lib/auth-client";


interface Post {
    id: string;
    content: string;
    time: string;
    stats: {
        comments: number;
        reposts: number;
        likes: number;
        views: number;
    };
    isSimulated: boolean;
    suggestions?: TweetSuggestion[];
    baseStats?: {
        views: number;
        likes: number;
        reposts: number;
        comments: number;
    };
    image?: string;
}

interface TimelineProps {
    onAnalysisUpdate: (analysis: TweetAnalysis | null) => void;
    onLoadingChange: (loading: boolean) => void;
    onTweetChange: (tweet: string) => void;
    onToggleChat?: () => void;
    isChatOpen?: boolean;
    onScrollToTop?: () => void;
    selectedHistoryItem?: any; // Using any to avoid circular import or duplication, but ideally should be HistoryItem
    onLoginClick: () => void;
    isLoading?: boolean;
    expandedReason?: string | null;
    onExpandedReasonChange?: (reason: string | null) => void;
    onPostCreated?: (id: string) => void;
    currentAnalysis?: TweetAnalysis | null; // Syncs variants when regenerated from AnalysisPanel
    selectedVariantIdx?: number | null; // For highlighting selected variant
    onModelTierChange?: (isPremium: boolean) => void; // Notify parent about model tier
}

export function Timeline({
    onAnalysisUpdate,
    onLoadingChange,
    onTweetChange,
    onToggleChat,
    isChatOpen,
    onScrollToTop,
    selectedHistoryItem,
    onLoginClick,
    isLoading,
    expandedReason,
    onExpandedReasonChange,
    onPostCreated,
    currentAnalysis,
    selectedVariantIdx,
    onModelTierChange
}: TimelineProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [currentPostId, setCurrentPostId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [globalStats, setGlobalStats] = useState<number>(0);
    const [loadingPostId, setLoadingPostId] = useState<string | null>(null);

    // const [expandedReason, setExpandedReason] = useState<string | null>(null); // Lifted to parent
    const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(new Set());
    const { data: session } = useSession();

    useEffect(() => {
        fetch("/api/stats")
            .then(res => res.json())
            .then(data => {
                if (data.total_simulations) {
                    setGlobalStats(data.total_simulations);
                }
            })
            .catch(err => console.error("Failed to fetch stats:", err));
    }, []);

    // Load selected history item
    useEffect(() => {
        if (selectedHistoryItem && selectedHistoryItem.analysis) {
            const analysis = selectedHistoryItem.analysis as TweetAnalysis;
            const postId = selectedHistoryItem.id;

            const baseStats = {
                views: analysis.predicted_views,
                likes: analysis.predicted_likes,
                reposts: analysis.predicted_retweets,
                comments: analysis.predicted_replies,
            };

            const historicalPost: Post = {
                id: postId,
                content: selectedHistoryItem.tweet_content,
                time: "History", // Indicator that this is from history
                stats: baseStats,
                isSimulated: true,
                suggestions: analysis.suggestions,
                baseStats
            };

            setPosts([historicalPost]); // Replace current view with history item
            // Also update the composer content
            onTweetChange(selectedHistoryItem.tweet_content);
            // Update analysis panel is handled by parent, but we can double check
            onAnalysisUpdate(analysis);
        }
    }, [selectedHistoryItem, onTweetChange, onAnalysisUpdate]);

    // Sync suggestions when analysis is regenerated from AnalysisPanel
    useEffect(() => {
        if (currentAnalysis?.suggestions && posts.length > 0) {
            // Update the most recent post with new suggestions
            setPosts((prevPosts) => {
                const updatedPosts = [...prevPosts];
                if (updatedPosts.length > 0 && updatedPosts[0].isSimulated) {
                    updatedPosts[0] = {
                        ...updatedPosts[0],
                        suggestions: currentAnalysis.suggestions,
                        baseStats: {
                            views: currentAnalysis.predicted_views,
                            likes: currentAnalysis.predicted_likes,
                            reposts: currentAnalysis.predicted_retweets,
                            comments: currentAnalysis.predicted_replies,
                        },
                    };
                }
                return updatedPosts;
            });
        }
    }, [currentAnalysis]);

    // Scroll to expanded variant
    useEffect(() => {
        if (expandedReason) {
            // Small delay to allow render
            setTimeout(() => {
                const element = document.getElementById(`variant-${expandedReason}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [expandedReason]);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };



    // Animate stats gradually after AI prediction comes in
    useEffect(() => {
        if (!isAnimating || !currentPostId) return;

        const targetPost = posts.find(p => p.id === currentPostId);
        if (!targetPost) return;

        const targetStats = (window as any).__tweetlab_target_stats;
        if (!targetStats) return;

        const interval = setInterval(() => {
            setPosts((currentPosts) => {
                return currentPosts.map((post) => {
                    if (post.id !== currentPostId) return post;

                    const newStats = {
                        views: Math.min(post.stats.views + Math.floor(targetStats.views * 0.05), targetStats.views),
                        likes: Math.min(post.stats.likes + Math.floor(targetStats.likes * 0.08), targetStats.likes),
                        reposts: Math.min(post.stats.reposts + Math.ceil(targetStats.reposts * 0.1), targetStats.reposts),
                        comments: Math.min(post.stats.comments + Math.ceil(targetStats.comments * 0.12), targetStats.comments),
                    };

                    if (
                        newStats.views >= targetStats.views &&
                        newStats.likes >= targetStats.likes &&
                        newStats.reposts >= targetStats.reposts &&
                        newStats.comments >= targetStats.comments
                    ) {
                        setIsAnimating(false);
                    }

                    return { ...post, stats: newStats };
                });
            });
        }, 150);

        return () => clearInterval(interval);
    }, [isAnimating, currentPostId, posts]);

    const handlePost = async (content: string, imageData?: { base64: string; mimeType: string }) => {
        const postId = Date.now().toString();

        // Create image preview URL from base64 if image is provided
        const imagePreview = imageData ? `data:${imageData.mimeType};base64,${imageData.base64}` : undefined;

        const newPost: Post = {
            id: postId,
            content,
            time: "just now",
            stats: { comments: 0, reposts: 0, likes: 0, views: 0 },
            isSimulated: true,
            image: imagePreview,
        };

        setPosts((prev) => [newPost, ...prev]);
        onTweetChange(content);
        onLoadingChange(true);
        onAnalysisUpdate(null);
        onLoadingChange(true);
        onAnalysisUpdate(null);
        setLoadingPostId(postId);
        if (onPostCreated) onPostCreated(postId);

        // Get or create anonymous ID from localStorage
        let anonymousId = localStorage.getItem("tweetlab_anonymous_id");
        if (!anonymousId) {
            anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            localStorage.setItem("tweetlab_anonymous_id", anonymousId);
        }

        try {
            const response = await fetch("/api/simulate-stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tweet: content,
                    imageBase64: imageData?.base64,
                    imageMimeType: imageData?.mimeType,
                    anonymousId,
                }),
            });

            // Handle rate limit
            if (response.status === 429) {
                const errorData = await response.json();
                // Remove the post since simulation failed
                setPosts((prev) => prev.filter(p => p.id !== postId));
                // Show error via alert or a more elegant UI message
                alert(errorData.error || "Daily analysis limit reached. You can analyze up to 8 posts per day.");
                onLoadingChange(false);
                setLoadingPostId(null);
                return;
            }

            if (!response.ok) {
                throw new Error("Simulation failed");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error("No response stream");
            }

            let analysis: TweetAnalysis | null = null;

            // Read the stream
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        if (data === "[DONE]") break;

                        try {
                            const parsed = JSON.parse(data);
                            // Handle tier info at the start of stream
                            if (parsed._tierInfo) {
                                if (onModelTierChange) {
                                    onModelTierChange(parsed._tierInfo.isPremiumTier);
                                }
                            }
                            if (parsed.complete && parsed.analysis) {
                                analysis = parsed.analysis as TweetAnalysis;
                            }
                        } catch {
                            // Ignore parse errors for partial data
                        }
                    }
                }
            }

            if (analysis) {
                const baseStats = {
                    views: analysis.predicted_views,
                    likes: analysis.predicted_likes,
                    reposts: analysis.predicted_retweets,
                    comments: analysis.predicted_replies,
                };

                (window as any).__tweetlab_target_stats = baseStats;

                setPosts((prev) =>
                    prev.map((p) =>
                        p.id === postId ? { ...p, suggestions: analysis!.suggestions, baseStats } : p
                    )
                );

                setCurrentPostId(postId);
                setIsAnimating(true);
                onAnalysisUpdate(analysis);
            }
        } catch (error) {
            console.error("Simulation error:", error);
            const fallbackStats = {
                views: Math.floor(Math.random() * 5000) + 100,
                likes: Math.floor(Math.random() * 200) + 10,
                reposts: Math.floor(Math.random() * 50) + 2,
                comments: Math.floor(Math.random() * 30) + 1,
            };
            (window as any).__tweetlab_target_stats = fallbackStats;
            setCurrentPostId(postId);
            setIsAnimating(true);
        } finally {
            onLoadingChange(false);
            setLoadingPostId(null);
        }
    };

    // Generate improved stats for suggestions
    const getImprovedStats = (baseStats: Post["baseStats"], index: number) => {
        if (!baseStats) return { views: 0, likes: 0, reposts: 0, comments: 0 };

        // Each suggestion gets progressively better stats
        const multipliers = [1.3, 1.6, 2.0];
        const multiplier = multipliers[index] || 1.5;

        return {
            views: Math.floor(baseStats.views * multiplier),
            likes: Math.floor(baseStats.likes * multiplier),
            reposts: Math.floor(baseStats.reposts * multiplier),
            comments: Math.floor(baseStats.comments * multiplier),
        };
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Sticky Header */}
            <div className="hidden sm:flex sticky top-0 z-10 h-[53px] items-center justify-between bg-twitter-header-bg backdrop-blur-md px-4 border-b border-border">
                {/* Desktop/Tablet Title */}
                <h1 className="text-xl font-bold">Home</h1>
            </div>

            <TweetComposer onPost={handlePost} isLoading={isLoading} />

            <div className="divide-y divide-border">
                {posts.map((post) => (
                    <div key={post.id}>
                        <TweetCard
                            name={session?.user?.name || "You"}
                            handle="you"
                            avatar={session?.user?.image}
                            time={post.time}
                            content={post.content}
                            comments={post.stats.comments}
                            reposts={post.stats.reposts}
                            likes={post.stats.likes}
                            views={post.stats.views}
                            isSimulated={post.isSimulated}
                            image={post.image}
                        />

                        {/* Simulation Loading Animation */}
                        {loadingPostId === post.id && (
                            <SimulationLoader />
                        )}

                        {/* Login Prompt for non-auth users - dismissible */}
                        {!session?.user && post.isSimulated && !dismissedPrompts.has(post.id) && (
                            <div className="bg-zinc-900 border-y border-zinc-800 p-4 flex flex-col items-center text-center space-y-3 relative">
                                <button
                                    onClick={() => setDismissedPrompts(prev => new Set(prev).add(post.id))}
                                    className="absolute top-2 right-2 p-1.5 hover:bg-zinc-800 rounded-full transition-colors"
                                >
                                    <X size={14} className="text-zinc-500" />
                                </button>
                                <p className="text-sm font-medium text-zinc-400">
                                    Create an account to save your posts and AI insights.
                                </p>
                                <button
                                    onClick={onLoginClick}
                                    className="px-6 py-2 bg-zinc-800 text-white font-bold rounded-full hover:bg-zinc-700 transition-colors flex items-center gap-2 shadow-sm border border-zinc-700"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Continue with Google
                                </button>
                            </div>
                        )}

                        {/* Improved Versions Section */}
                        {post.suggestions && post.suggestions.length > 0 && (
                            <div className="border-t border-border">
                                {/* Clean Header */}
                                <div className="px-4 py-3 border-b border-border bg-secondary/20">
                                    <h3 className="text-[15px] font-semibold flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-twitter-blue fill-twitter-blue" />
                                        Optimized Variations
                                    </h3>
                                    <p className="text-[13px] text-muted-foreground mt-0.5 ml-6">Higher predicted engagement</p>
                                </div>

                                {/* Suggestion Tweet Cards */}
                                {post.suggestions.map((suggestion, idx) => {
                                    const improvedStats = getImprovedStats(post.baseStats, idx);
                                    const isExpanded = expandedReason === `${post.id}-${idx}`;

                                    // Generate a rating based on stats (0-100)
                                    const rating = Math.min(99, Math.floor(improvedStats.likes / 5));
                                    const ratingColor = rating > 80 ? "text-green-500" : rating > 50 ? "text-yellow-500" : "text-orange-500";
                                    const ratingBg = rating > 80 ? "bg-green-500/10 border-green-500/20" : rating > 50 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-orange-500/10 border-orange-500/20";

                                    return (
                                        <div
                                            key={idx}
                                            id={`variant-${post.id}-${idx}`}
                                            className={`relative group border-b border-border last:border-b-0 bg-background hover:bg-secondary/5 transition-all duration-300 ${isExpanded ? 'min-h-[350px]' : ''}`}
                                        >
                                            {/* Minimal Question Mark Button */}
                                            <div className="absolute top-3 right-3 z-20">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onExpandedReasonChange) {
                                                            onExpandedReasonChange(isExpanded ? null : `${post.id}-${idx}`);
                                                        }
                                                    }}
                                                    className={`p-1.5 rounded-full transition-all duration-200 ${isExpanded ? 'bg-twitter-blue text-white rotate-180' : 'text-muted-foreground hover:bg-twitter-blue/10 hover:text-twitter-blue'}`}
                                                    title={isExpanded ? "Close analysis" : "View analysis"}
                                                >
                                                    {isExpanded ? <Zap size={15} className="fill-current" /> : <HelpCircle size={15} />}
                                                </button>
                                            </div>

                                            {/* Wrapper for TweetCard to handle overlay positioning */}
                                            <div className="relative">
                                                <TweetCard
                                                    name={session?.user?.name || "You"}
                                                    handle="you"
                                                    avatar={session?.user?.image}
                                                    time={`optimized · ${rating}`}
                                                    content={suggestion.tweet}
                                                    comments={improvedStats.comments}
                                                    reposts={improvedStats.reposts}
                                                    likes={improvedStats.likes}
                                                    views={improvedStats.views}
                                                    isSimulated={false}
                                                    hideMenu={true}
                                                    image={post.image}
                                                />

                                                {isExpanded && (
                                                    <div
                                                        className="absolute inset-0 z-10 bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-150 min-h-[400px]"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ height: 'auto', minHeight: '400px' }}
                                                    >
                                                        {/* Compact Header */}
                                                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                {/* Version badge */}
                                                                <div className={`px-2.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider ${suggestion.version === "Curiosity" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                                                                    suggestion.version === "Controversy" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                                                        suggestion.version === "Authority" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                                                                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                    }`}>
                                                                    {suggestion.version}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <TrendingUp size={12} className="text-emerald-500" />
                                                                    <span className="text-emerald-500 font-medium text-[12px]">
                                                                        +{Math.max(8, rating - 15)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {/* Copy button - icon only */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCopy(suggestion.tweet, `${post.id}-${idx}`);
                                                                    }}
                                                                    className={`p-2 rounded-full transition-all ${copiedId === `${post.id}-${idx}`
                                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                                        : 'hover:bg-white/10 text-zinc-400 hover:text-white'
                                                                        }`}
                                                                    title={copiedId === `${post.id}-${idx}` ? "Copied!" : "Copy tweet"}
                                                                >
                                                                    {copiedId === `${post.id}-${idx}` ? <Check size={15} /> : <Copy size={15} />}
                                                                </button>
                                                                {/* Close button */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (onExpandedReasonChange) onExpandedReasonChange(null);
                                                                    }}
                                                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                                                                >
                                                                    <X size={15} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Headline */}
                                                        <div className="px-4 py-3">
                                                            <h3 className="text-[14px] font-medium text-white/90">
                                                                {suggestion.version === "Curiosity" ? "Creates an irresistible information gap" :
                                                                    suggestion.version === "Controversy" ? "Sparks debate and drives replies" :
                                                                        suggestion.version === "Authority" ? "Positions you as an expert" :
                                                                            "Optimized for maximum engagement"}
                                                            </h3>
                                                        </div>

                                                        {/* Scrollable Content */}
                                                        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                                            {/* Why this works */}
                                                            <div className="bg-zinc-900/50 rounded border border-white/5 p-3">
                                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                                    <Sparkles size={11} className="text-amber-400" />
                                                                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Why It Works</span>
                                                                </div>
                                                                <p className="text-[13px] text-zinc-300 leading-relaxed font-light">
                                                                    {suggestion.reason || (
                                                                        suggestion.version === "Curiosity"
                                                                            ? "Curiosity gaps make users stop scrolling. The brain cannot resist incomplete patterns - this is the #1 hook pattern used by viral accounts."
                                                                            : suggestion.version === "Controversy"
                                                                                ? "Challenging beliefs triggers emotional responses that compel replies. Replies are weighted 75x more than likes in X's algorithm."
                                                                                : suggestion.version === "Authority"
                                                                                    ? "Speaking with confidence positions you as a trusted source. Authority content gets more bookmarks and profile clicks."
                                                                                    : "This version is optimized for X's key ranking signals including dwell time and early engagement."
                                                                    )}
                                                                </p>
                                                            </div>

                                                            {/* Algorithm insight */}
                                                            <div className="bg-zinc-900/50 rounded border border-white/5 p-3">
                                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                                    <Zap size={11} className="text-blue-400" />
                                                                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Algorithm Insight</span>
                                                                </div>
                                                                <p className="text-[13px] text-zinc-300 leading-relaxed font-light">
                                                                    {suggestion.version === "Curiosity"
                                                                        ? "Dwell time is a core X ranking signal. Curiosity hooks increase dwell by 2-3x."
                                                                        : suggestion.version === "Controversy"
                                                                            ? "Replies are weighted 75x more than likes. Controversial takes trigger viral distribution."
                                                                            : suggestion.version === "Authority"
                                                                                ? "Bookmarks have a 50x multiplier. Expert content compounds reach over time."
                                                                                : "The first 15-30 minutes determine if X's algorithm amplifies your post."}
                                                                </p>
                                                            </div>

                                                            {/* Predicted reactions */}
                                                            <div>
                                                                <div className="flex items-center gap-1.5 mb-2">
                                                                    <Users size={11} className="text-zinc-600" />
                                                                    <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Predicted Reactions</span>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    {(suggestion.audience_reactions?.length > 0
                                                                        ? suggestion.audience_reactions
                                                                        : suggestion.version === "Curiosity"
                                                                            ? ["Wait, what's the answer?", "I need to know more!", "This got me curious"]
                                                                            : suggestion.version === "Controversy"
                                                                                ? ["Hard disagree, here's why...", "Finally someone said it!", "This is a hot take"]
                                                                                : suggestion.version === "Authority"
                                                                                    ? ["Saving this for later", "Great insight!", "Following for more"]
                                                                                    : ["Interesting perspective", "Worth engaging with", "Good point"]
                                                                    ).slice(0, 3).map((reaction, rIdx) => (
                                                                        <div
                                                                            key={rIdx}
                                                                            className="flex items-center gap-2 bg-transparent rounded px-1.5 py-1"
                                                                        >
                                                                            <span className="text-[11px] opacity-70">{rIdx === 0 ? "💭" : rIdx === 1 ? "🔥" : "💡"}</span>
                                                                            <p className="text-[12px] text-zinc-500 italic">"{reaction}"</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
                {posts.length === 0 && (
                    <div className="p-8 py-20 text-center">
                        <div className="max-w-sm mx-auto space-y-5">
                            <div className="relative">
                                <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-tr from-twitter-blue to-purple-500 rounded-full scale-150" />
                                <div className="relative bg-gradient-to-br from-twitter-blue/10 to-purple-500/10 dark:from-twitter-blue/20 dark:to-purple-500/20 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border border-twitter-blue/20">
                                    <span className="text-3xl">🚀</span>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Test your tweet before you post it.
                            </h2>
                            <p className="hidden sm:block text-muted-foreground text-[15px] leading-relaxed">
                                TweetLab simulates how X will react to your tweet likes, replies, reposts, and engagement so you can improve it before it goes live.
                            </p>

                            {/* Global Stats */}
                            <div className="pt-2 pb-2">
                                <p className="text-sm font-medium text-muted-foreground/80">
                                    <span className="text-foreground font-bold">{globalStats.toLocaleString()}</span> tweets have been stress-tested
                                </p>
                            </div>

                            <div className="pt-2 flex flex-wrap justify-center gap-2 text-[13px] font-medium text-muted-foreground">
                                <div className="px-3 py-1.5 bg-secondary rounded-full border border-border">Engagement Prediction</div>
                                <div className="px-3 py-1.5 bg-secondary rounded-full border border-border">Smart Refinements</div>
                                <div className="px-3 py-1.5 bg-secondary rounded-full border border-border">Visual Preview</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
