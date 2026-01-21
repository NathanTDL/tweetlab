export interface TweetStats {
    comments: number;
    reposts: number;
    likes: number;
    views: number;
}

export function generateRandomStats(): TweetStats {
    // Generate realistic-looking initial stats (low)
    return {
        comments: 0,
        reposts: 0,
        likes: 0,
        views: 0,
    };
}

export function simulateEngagement(
    currentStats: TweetStats,
    elapsedTime: number
): TweetStats {
    // Access simpler growth curve
    const growthFactor = Math.max(0, 1 - elapsedTime / 15000); // Decays over 15s

    if (Math.random() > 0.7) return currentStats; // Sometimes no update

    return {
        comments: currentStats.comments + (Math.random() > 0.95 ? 1 : 0),
        reposts: currentStats.reposts + (Math.random() > 0.98 ? 1 : 0),
        likes: currentStats.likes + (Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0),
        views: currentStats.views + Math.floor(Math.random() * 10) + 1,
    };
}
