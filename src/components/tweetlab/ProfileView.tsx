"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { ArrowLeft, Calendar, Users, Fingerprint, Database, LogOut, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/tweetlab/ThemeToggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EditProfileModal } from "@/components/tweetlab/EditProfileModal";
import { TweetCard } from "@/components/tweetlab/TweetCard";
import { TweetAnalysis } from "@/lib/types";

interface HistoryItem {
    id: string;
    tweet_content: string;
    analysis: TweetAnalysis | null;
    created_at: string;
    image_data?: string;
}

interface UserProfileData {
    bio?: string;
    target_audience?: string;
    ai_context?: string;
    x_handle?: string;
}

interface ProfileViewProps {
    onBack: () => void;
}

export function ProfileView({ onBack }: ProfileViewProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [userData, setUserData] = useState<UserProfileData>({});

    // Fetch History and User Data
    useEffect(() => {
        if (session?.user) {
            fetch("/api/history")
                .then(res => res.json())
                .then(data => setHistory(data.history || []));

            fetch("/api/user/me")
                .then(res => res.json())
                .then(data => {
                    if (data.user) setUserData(data.user);
                });
        }
    }, [session]);

    if (!session?.user) return null;

    const initials = session.user.name
        ? session.user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : "U";

    const joinDate = new Date(session.user.createdAt || Date.now()).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setHistory(prev => prev.filter(h => h.id !== id));
        try {
            await fetch('/api/history', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handle = userData.x_handle
        ? userData.x_handle.replace(/^@/, '')
        : (session.user as any).username || session.user.name?.replace(/\s+/g, '').toLowerCase() || "user";

    return (
        <div className="flex flex-col w-full min-h-screen pb-20">
            {/* Modern Floating Header */}
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-all">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-full hover:bg-secondary/50 transition-colors group"
                    >
                        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold leading-5 tracking-tight">{session.user.name}</h2>
                        <span className="text-xs text-muted-foreground font-medium">{history.length} simulations</span>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative">
                {/* Artistic Gradient Banner */}
                <div className="h-[220px] w-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-purple-900 to-slate-900"></div>
                    <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                    <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-background/40 to-transparent"></div>
                </div>

                {/* Profile Header Content */}
                <div className="px-6 relative -mt-[60px] pb-4">
                    <div className="flex justify-between items-end">
                        {/* Avatar with Glow */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-tr from-amber-500 to-yellow-500 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-300"></div>
                            <Avatar className="relative w-[130px] h-[130px] border-[5px] border-background shadow-xl">
                                {session.user.image && <AvatarImage src={session.user.image} className="object-cover" />}
                                <AvatarFallback className="text-4xl bg-gradient-to-br from-gray-800 to-black text-white font-extrabold tracking-tighter">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Action Buttons */}
                        <div className="mb-4">
                            <Button
                                className="rounded-full font-bold bg-background border-2 border-border hover:border-foreground/20 hover:bg-secondary/50 transition-all shadow-sm"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                Edit Profile
                            </Button>
                        </div>
                    </div>

                    {/* Name & Handle */}
                    <div className="mt-4">
                        <h1 className="text-2xl font-black tracking-tight leading-tight">{session.user.name}</h1>
                        <span className="text-[15px] text-muted-foreground font-medium">@{handle}</span>
                    </div>

                    {/* Bio */}
                    {userData.bio ? (
                        <p className="mt-3 text-[15px] leading-relaxed max-w-lg text-foreground/90">
                            {userData.bio}
                        </p>
                    ) : (
                        <p className="mt-3 text-[15px] leading-relaxed max-w-lg text-muted-foreground/60 italic">
                            No bio yet. Add one to help the AI understand you.
                        </p>
                    )}

                    {/* Meta Row */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-[14px] text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-0.5 rounded-md">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Joined {joinDate}</span>
                        </div>

                        {/* Theme and Logout for Mobile ease */}
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-border hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* PERSONA DASHBOARD CARD */}
                    {(userData.target_audience || userData.ai_context) && (
                        <div className="mt-6 p-1 rounded-2xl bg-gradient-to-br from-border/50 to-border/10">
                            <div className="bg-background/60 backdrop-blur-md rounded-xl p-5 border border-white/5 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-md bg-amber-500/10">
                                        <Fingerprint className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <h3 className="font-bold text-sm tracking-wide text-foreground/80 uppercase">AI Persona DNA</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {userData.target_audience && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                                                <Users className="h-3.5 w-3.5" />
                                                Target Audience
                                            </div>
                                            <p className="text-sm font-medium leading-snug pl-5 border-l-2 border-amber-500/30">
                                                {userData.target_audience}
                                            </p>
                                        </div>
                                    )}

                                    {userData.ai_context && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                                                <Database className="h-3.5 w-3.5" />
                                                Simulation Rules
                                            </div>
                                            <p className="text-sm font-medium leading-snug pl-5 border-l-2 border-purple-500/30">
                                                {userData.ai_context}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs - Only Posts */}
            <div className="sticky top-[73px] z-20 bg-background/95 backdrop-blur-sm border-b border-border mt-2">
                <div className="flex px-4">
                    <button
                        className="hover:bg-secondary/30 transition-colors py-4 px-6 relative flex justify-center group"
                    >
                        <span className="text-[15px] font-extrabold text-foreground">
                            Posts
                        </span>
                        <div className="absolute bottom-0 w-full h-[3px] bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
                    </button>
                </div>
            </div>

            {/* Feed */}
            <div className="divide-y divide-border min-h-[300px]">
                {history.length > 0 ? (
                    history.map((item) => (
                        <TweetCard
                            key={item.id}
                            name={session.user.name || "User"}
                            handle={(session.user as any).username || session.user.name?.replace(/\s+/g, '').toLowerCase() || "user"}
                            avatar={session.user.image}
                            time={new Date(item.created_at).toLocaleDateString()}
                            content={item.tweet_content}
                            comments={item.analysis?.predicted_replies || 0}
                            reposts={item.analysis?.predicted_retweets || 0}
                            likes={item.analysis?.predicted_likes || 0}
                            views={item.analysis?.predicted_views || 0}
                            isSimulated={true}
                            image={item.image_data}
                            onDelete={() => handleDelete(item.id)}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-4 bg-secondary/50 rounded-full">
                            <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg">No simulations yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Start simulating tweets to build your history and train your AI persona.
                            </p>
                        </div>
                        <Button className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold" onClick={onBack}>
                            Run Simulation
                        </Button>
                    </div>
                )}
            </div>

            <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
        </div>
    );
}
