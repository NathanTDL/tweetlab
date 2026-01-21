import { useSession } from "@/lib/auth-client";
import { History as HistoryIcon, MessageSquare, Heart, Repeat2, Eye, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { TweetAnalysis } from "@/lib/types";

interface HistoryItem {
    id: string;
    tweet_content: string;
    analysis: TweetAnalysis | null;
    created_at: string;
    image_data?: string;
}

interface HistoryProps {
    onSelectHistory?: (item: HistoryItem) => void;
    hideHeader?: boolean;
}

export function History({ onSelectHistory, hideHeader }: HistoryProps) {
    const { data: session } = useSession();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!session?.user) return;

        setIsLoading(true);
        try {
            const res = await fetch("/api/history");
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setIsLoading(false);
        }
    }, [session?.user]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent selection when deleting

        // Optimistic update
        setHistory(prev => prev.filter(item => item.id !== id));

        try {
            await fetch("/api/history", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
        } catch (error) {
            console.error("Failed to delete item:", error);
            // Revert on error (could fetch again)
            fetchHistory();
        }
    };

    if (!session?.user) {
        return null;
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            {!hideHeader && (
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background sticky top-0 z-10 text-foreground">
                    <HistoryIcon className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-[15px]">Your History</h3>
                </div>
            )}

            {/* History List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse space-y-2">
                                <div className="h-3 bg-secondary rounded w-3/4" />
                                <div className="h-3 bg-secondary rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                        <HistoryIcon className="h-8 w-8 text-muted-foreground/30 mb-1" />
                        <p>No simulations yet.</p>
                        <p className="text-xs opacity-70">Your simulated tweets will verify here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => onSelectHistory?.(item)}
                                className="group relative w-full text-left p-4 hover:bg-amber-500/5 transition-colors cursor-pointer"
                            >
                                {/* Delete Button - Absolute positioned, visible on hover */}
                                <button
                                    onClick={(e) => handleDelete(e, item.id)}
                                    className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all z-20"
                                    title="Delete from history"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>

                                {/* Tweet preview */}
                                <p className="text-sm line-clamp-2 mb-2 pr-6 font-medium text-foreground">
                                    {item.tweet_content}
                                </p>

                                {/* Image Preview in History */}
                                {item.image_data && (
                                    <div className="mb-2 rounded-lg overflow-hidden border border-border h-32 w-full relative">
                                        <img
                                            src={item.image_data}
                                            alt="History attachment"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Stats row */}
                                {item.analysis && (
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1" title="Predicted Likes">
                                            <Heart className="h-3 w-3" />
                                            {formatNumber(item.analysis.predicted_likes)}
                                        </span>
                                        <span className="flex items-center gap-1" title="Predicted Replies">
                                            <MessageSquare className="h-3 w-3" />
                                            {formatNumber(item.analysis.predicted_replies)}
                                        </span>
                                        <span className="flex items-center gap-1" title="Predicted Reposts">
                                            <Repeat2 className="h-3 w-3" />
                                            {formatNumber(item.analysis.predicted_retweets)}
                                        </span>
                                        <span className="flex items-center gap-1" title="Predicted Views">
                                            <Eye className="h-3 w-3" />
                                            {formatNumber(item.analysis.predicted_views)}
                                        </span>
                                    </div>
                                )}

                                {/* Timestamp */}
                                <p className="text-[11px] text-muted-foreground/60 mt-2">
                                    {formatDate(item.created_at)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
