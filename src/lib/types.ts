// Type definitions for TweetLab AI responses

export interface TweetSuggestion {
    version: "Curiosity" | "Authority" | "Controversy";
    tweet: string;
    reason: string;
    audience_reactions: string[];
}

export interface TweetAnalysis {
    tweet: string;
    predicted_likes: number;
    predicted_retweets: number;
    predicted_replies: number;
    predicted_quotes: number;
    predicted_views: number;
    engagement_outlook: "Low" | "Medium" | "High";
    engagement_justification: string;
    analysis: string[];
    suggestions: TweetSuggestion[];
}

export interface SimulatedReply {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    content: string;
    sentiment: "positive" | "neutral" | "negative" | "question";
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}
