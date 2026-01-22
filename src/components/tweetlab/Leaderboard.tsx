"use client";

import { Trophy, TrendingUp, Users, Eye, MessageCircle, Repeat, Heart, Loader2, Share2, X, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState, useRef } from "react";
import { TweetAnalysis } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ParticipationModal } from "./ParticipationModal";
import { useSession } from "@/lib/auth-client";
import { toPng } from 'html-to-image';

interface LeaderboardItemData {
    id: string;
    tweet_content: string;
    created_at: string;
    analysis: TweetAnalysis | null;
    calculated_score: number;
    user?: {
        name: string;
        handle: string;
        image: string;
        is_anonymous: boolean;
    };
}



export function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardItemData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isParticipationModalOpen, setIsParticipationModalOpen] = useState(false);
    const [userMode, setUserMode] = useState<string>('none');
    const { data: session } = useSession();

    const fetchUserStatus = async () => {
        try {
            const res = await fetch("/api/user/me");
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setUserMode(data.user.leaderboard_mode || 'none');
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Share Image Logic
    const shareRef = useRef<HTMLDivElement>(null);
    const [shareData, setShareData] = useState<LeaderboardItemData | null>(null);
    const [shareRank, setShareRank] = useState<number>(1);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const openShareModal = (item: LeaderboardItemData, rank: number) => {
        setShareData(item);
        setShareRank(rank);
        setIsShareModalOpen(true);
    };

    const handleDownloadImage = async () => {
        if (!shareRef.current || !shareData) return;
        setIsGenerating(true);
        try {
            const dataUrl = await toPng(shareRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `tweetlab-rank-${shareRank}-score-${shareData.calculated_score}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const closeShareModal = () => {
        setIsShareModalOpen(false);
        setShareData(null);
    };

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await fetch("/api/leaderboard");
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboardData(data.leaderboard || []);
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchLeaderboard();
        if (session?.user) fetchUserStatus();
    }, [session?.user]);

    const topThree = leaderboardData.slice(0, 3);

    return (
        <div className="flex flex-col w-full min-h-screen bg-background text-foreground animate-in fade-in duration-500">

            <ParticipationModal
                isOpen={isParticipationModalOpen}
                onClose={() => setIsParticipationModalOpen(false)}
                onSuccess={() => {
                    fetchUserStatus();
                    // Refetch leaderboard to update if user just joined
                    async function refetch() {
                        const res = await fetch("/api/leaderboard");
                        if (res.ok) {
                            const data = await res.json();
                            setLeaderboardData(data.leaderboard || []);
                        }
                    }
                    refetch();
                }}
            />

            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-yellow-500/10 rounded-full">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight">Top Performers</h1>
                        </div>
                        <p className="text-sm text-muted-foreground ml-11">
                            Highest engagement simulations globally
                        </p>
                    </div>

                    {/* Participate Button */}
                    {session?.user && userMode === 'none' && !isLoading && (
                        <Button
                            onClick={() => setIsParticipationModalOpen(true)}
                            className="bg-twitter-blue hover:bg-twitter-blue/90 text-white rounded-full font-bold shadow-lg animate-pulse"
                        >
                            Participate
                        </Button>
                    )}

                    {/* If participating, show status? Optional */}
                    {userMode !== 'none' && (
                        <button
                            onClick={() => setIsParticipationModalOpen(true)}
                            className="text-xs font-medium text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full border border-border hover:bg-secondary/50 hover:text-foreground transition-all cursor-pointer"
                        >
                            {userMode === 'anonymous' ? 'Participating Anonymously' : 'Participating Publicly'}
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-twitter-blue" />
                        <p className="text-muted-foreground text-sm">Loading top simulations...</p>
                    </div>
                ) : leaderboardData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                        <Trophy className="h-12 w-12 text-muted-foreground/20 mb-4" />
                        <p>No simulations found yet.</p>
                        <p className="text-sm">Participate and simulate to see your tweets here!</p>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium Card - Only show if we have data */}
                        {topThree.length > 0 && (
                            <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 via-orange-900/10 to-black p-6 mb-6">
                                {/* Premium Background Effects */}
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#3a280030,_transparent_50%)]" />
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Trophy size={200} className="text-yellow-500 transform rotate-12 -translate-y-8 translate-x-8" />
                                </div>

                                <div className="relative z-10 flex items-end justify-center gap-2 sm:gap-6 h-[280px] pb-2">
                                    {/* 2nd Place */}
                                    {topThree[1] && (() => {
                                        const u = topThree[1].user || { name: "User", handle: "", is_anonymous: false, image: "" };
                                        const name = u.name;
                                        const handle = u.handle ? `@${u.handle.replace('@', '')}` : (u.is_anonymous ? "" : `@user_${topThree[1].id.slice(0, 3)}`);
                                        const avatar = u.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.is_anonymous ? 'anon' : topThree[1].id}`;
                                        const isClickable = !u.is_anonymous && u.handle;

                                        return (
                                            <div className="flex flex-col items-center gap-2 w-1/3">
                                                {/* Podium Pedestal */}
                                                <div className="relative flex flex-col items-center">
                                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-slate-400 overflow-hidden shadow-xl bg-gradient-to-br from-slate-700 to-slate-900 ring-2 ring-slate-500/20 ${isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                                                        onClick={() => isClickable && window.open(`https://x.com/${u.handle.replace('@', '')}`, '_blank')}
                                                    >
                                                        <Avatar className="w-full h-full">
                                                            <AvatarImage src={avatar} className="object-cover" />
                                                            <AvatarFallback className="bg-slate-700 text-slate-300 text-lg font-bold">2</AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                                                        #2
                                                    </div>
                                                </div>
                                                <div className="text-center w-full mt-3">
                                                    <p className={`font-bold text-[13px] truncate w-full px-1 text-white ${isClickable ? 'hover:underline cursor-pointer' : ''}`}
                                                        onClick={() => isClickable && window.open(`https://x.com/${u.handle.replace('@', '')}`, '_blank')}
                                                    >{name}</p>
                                                    {handle && <p className="text-[10px] text-white/50 truncate">{handle}</p>}
                                                </div>
                                                {/* Silver Pedestal Base */}
                                                <div className="w-16 h-12 bg-gradient-to-b from-slate-400 via-slate-500 to-slate-700 rounded-t-lg shadow-2xl mt-1 flex items-center justify-center">
                                                    <span className="text-xl font-black text-slate-800">2</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* 1st Place */}
                                    {topThree[0] && (() => {
                                        const u = topThree[0].user || { name: "User", handle: "", is_anonymous: false, image: "" };
                                        const name = u.name;
                                        const handle = u.handle ? `@${u.handle.replace('@', '')}` : (u.is_anonymous ? "" : `@user_${topThree[0].id.slice(0, 3)}`);
                                        const avatar = u.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.is_anonymous ? 'anon' : topThree[0].id}`;
                                        const isClickable = !u.is_anonymous && u.handle;

                                        return (
                                            <div className="flex flex-col items-center gap-2 w-1/3 z-10 relative">
                                                {/* Crown/Glow Effect */}
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                                    <div className="w-8 h-8 bg-yellow-500/20 rounded-full blur-xl" />
                                                </div>

                                                <div className="relative flex flex-col items-center">
                                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-yellow-500 overflow-hidden shadow-2xl shadow-yellow-500/30 bg-gradient-to-br from-yellow-600 to-orange-700 ring-2 ring-yellow-500/30 ${isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                                                        onClick={() => isClickable && window.open(`https://x.com/${u.handle.replace('@', '')}`, '_blank')}
                                                    >
                                                        <Avatar className="w-full h-full">
                                                            <AvatarImage src={avatar} className="object-cover" />
                                                            <AvatarFallback className="bg-yellow-600 text-yellow-950 text-2xl font-bold">1</AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-950 text-[11px] font-black px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                        <Trophy size={12} className="fill-current" /> #1
                                                    </div>
                                                </div>
                                                <div className="text-center mt-4 w-full">
                                                    <p className={`font-bold text-[16px] truncate w-full px-1 text-white ${isClickable ? 'hover:underline cursor-pointer' : ''}`}
                                                        onClick={() => isClickable && window.open(`https://x.com/${u.handle.replace('@', '')}`, '_blank')}
                                                    >{name}</p>
                                                    {handle && <p className="text-[12px] text-white/50 truncate">{handle}</p>}
                                                </div>
                                                {/* Gold Pedestal Base */}
                                                <div className="w-18 h-16 bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-700 rounded-t-lg shadow-2xl mt-1 flex items-center justify-center">
                                                    <span className="text-2xl font-black text-yellow-900">1</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* 3rd Place */}
                                    {topThree[2] && (() => {
                                        const u = topThree[2].user || { name: "User", handle: "", is_anonymous: false, image: "" };
                                        const name = u.name;
                                        const handle = u.handle ? `@${u.handle.replace('@', '')}` : (u.is_anonymous ? "" : `@user_${topThree[2].id.slice(0, 3)}`);
                                        const avatar = u.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.is_anonymous ? 'anon' : topThree[2].id}`;
                                        const isClickable = !u.is_anonymous && u.handle;

                                        return (
                                            <div className="flex flex-col items-center gap-2 w-1/3">
                                                {/* Podium Pedestal */}
                                                <div className="relative flex flex-col items-center">
                                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-orange-400 overflow-hidden shadow-xl bg-gradient-to-br from-orange-700 to-orange-900 ring-2 ring-orange-500/20 ${isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                                                        onClick={() => isClickable && window.open(`https://x.com/${u.handle.replace('@', '')}`, '_blank')}
                                                    >
                                                        <Avatar className="w-full h-full">
                                                            <AvatarImage src={avatar} className="object-cover" />
                                                            <AvatarFallback className="bg-orange-700 text-orange-200 text-lg font-bold">3</AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-400 to-orange-500 text-orange-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                                                        #3
                                                    </div>
                                                </div>
                                                <div className="text-center w-full mt-3">
                                                    <p className={`font-bold text-[13px] truncate w-full px-1 text-white ${isClickable ? 'hover:underline cursor-pointer' : ''}`}
                                                        onClick={() => isClickable && window.open(`https://x.com/${u.handle.replace('@', '')}`, '_blank')}
                                                    >{name}</p>
                                                    {handle && <p className="text-[10px] text-white/50 truncate">{handle}</p>}
                                                </div>
                                                {/* Bronze Pedestal Base */}
                                                <div className="w-16 h-10 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-700 rounded-t-lg shadow-2xl mt-1 flex items-center justify-center">
                                                    <span className="text-xl font-black text-orange-900">3</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                                        <th className="px-4 py-3 w-[60px] text-center">Rank</th>
                                        <th className="px-4 py-3 w-[250px]">User</th>
                                        <th className="px-4 py-3">Tweet</th>
                                        <th className="px-4 py-3 w-[200px] text-right">Impact Score</th>
                                        <th className="px-4 py-3 w-[100px] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {leaderboardData.map((item, index) => {
                                        const user = item.user || { name: "Simulated User", handle: "", image: "", is_anonymous: false };
                                        const displayName = user.name || "Simulated User";
                                        const displayHandle = user.handle ? `@${user.handle.replace('@', '')}` : (user.is_anonymous ? "" : `@user_${item.id.slice(0, 4)}`);
                                        const avatarSrc = user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.is_anonymous ? 'anonymous' : item.id}`;
                                        const analysis = item.analysis;

                                        return (
                                            <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-center font-mono text-muted-foreground group-hover:text-white">
                                                    #{index + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 border border-white/10">
                                                            <AvatarImage src={avatarSrc} />
                                                            <AvatarFallback>{displayName[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-medium text-white leading-tight">{displayName}</span>
                                                            {displayHandle && <span className="text-[11px] text-muted-foreground">{displayHandle}</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-[13px] text-zinc-300 line-clamp-1 group-hover:text-zinc-100 transition-colors cursor-default" title={item.tweet_content}>
                                                        {item.tweet_content}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-4 text-[12px] text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Heart size={12} className="group-hover:text-pink-500 transition-colors" />
                                                            <span>{analysis?.predicted_likes || 0}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Eye size={12} className="group-hover:text-blue-400 transition-colors" />
                                                            <span>{((analysis?.predicted_views || 0) / 1000).toFixed(1)}k</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openShareModal(item, index + 1);
                                                        }}
                                                        className="p-1.5 rounded bg-white/5 hover:bg-yellow-500/20 text-muted-foreground hover:text-yellow-500 transition-colors"
                                                        title="Share Score"
                                                    >
                                                        <Share2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
                {/* Beautiful Share Modal */}
                {isShareModalOpen && shareData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={closeShareModal}
                        />

                        {/* Modal Content */}
                        <div className="relative z-10 w-full max-w-2xl animate-in zoom-in-95 fade-in duration-200">
                            {/* Close Button */}
                            <button
                                onClick={closeShareModal}
                                className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            {/* Preview Card - This is what gets rendered */}
                            <div ref={shareRef} className="w-full aspect-[1.91/1] relative overflow-hidden bg-black rounded-3xl border-0 shadow-2xl flex flex-col">
                                {/* Golden/Dark Premium Background */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#3a2800,_#000000_60%)]" />
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

                                {/* Background Decorative Elements */}
                                <div className="absolute -top-10 -right-10 opacity-10">
                                    <Trophy size={300} className="text-yellow-500/20 rotate-12" />
                                </div>

                                <div className="relative z-10 flex-1 flex flex-col p-6 sm:p-10 justify-between">

                                    {/* Header: Rank Badge & Branding */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 pr-6 pl-2 py-2 rounded-full backdrop-blur-sm shadow-xl">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${shareRank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950' : shareRank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900' : shareRank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-600 text-orange-950' : 'bg-slate-700 text-white'}`}>
                                                #{shareRank}
                                            </div>
                                            <span className="text-yellow-500/90 font-bold tracking-wide uppercase text-sm">Top Performer</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-60">
                                            <Trophy size={18} className="text-yellow-500" />
                                            <span className="font-black tracking-tight text-white text-lg">TweetLab</span>
                                        </div>
                                    </div>

                                    {/* Center: Score & User */}
                                    <div className="flex flex-row items-center gap-6 sm:gap-10 my-2">
                                        {/* Big Score */}
                                        <div className="flex flex-col items-start min-w-[140px]">
                                            <span className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 drop-shadow-2xl leading-none">
                                                {shareData.calculated_score}
                                            </span>

                                        </div>

                                        {/* User Info */}
                                        <div className="flex flex-col pl-6 border-l border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)] overflow-hidden bg-black">
                                                    <img
                                                        src={shareData.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${shareData.id}`}
                                                        className="w-full h-full object-cover"
                                                        crossOrigin="anonymous"
                                                        alt=""
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${shareData.id}`;
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-xl sm:text-2xl font-bold text-white leading-tight">{shareData.user?.name || "Anonymous"}</p>
                                                    <p className="text-white/40 text-sm">@{shareData.user?.handle?.replace('@', '') || "tweetlab_user"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom: Tweet Preview & Stats */}
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg">
                                        <p className="text-white/90 text-base sm:text-lg leading-snug line-clamp-2 font-medium mb-3 italic">
                                            "{shareData.tweet_content}"
                                        </p>

                                        <div className="flex items-center gap-4 sm:gap-6 border-t border-white/5 pt-3">
                                            {[
                                                { icon: Eye, value: ((shareData.analysis?.predicted_views || 0) / 1000).toFixed(1) + 'k', label: 'Views' },
                                                { icon: Heart, value: shareData.analysis?.predicted_likes || 0, label: 'Likes' },
                                                { icon: Repeat, value: shareData.analysis?.predicted_retweets || 0, label: 'Reposts' },
                                                { icon: MessageCircle, value: shareData.analysis?.predicted_replies || 0, label: 'Replies' },
                                            ].map((stat, i) => (
                                                <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-white/50">
                                                    <stat.icon size={14} className={i === 1 ? 'text-pink-500' : i === 2 ? 'text-green-500' : 'text-blue-400'} />
                                                    <span className="font-bold text-xs sm:text-sm text-white/90">{stat.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-center mt-8">
                                <button
                                    onClick={handleDownloadImage}
                                    disabled={isGenerating}
                                    className="relative group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-black/40 backdrop-blur-md border border-yellow-500/30 text-yellow-500 font-black text-lg shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:shadow-[0_0_25px_rgba(234,179,8,0.2)] hover:bg-yellow-500/10 hover:border-yellow-500/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 w-full sm:w-auto min-w-[200px]"
                                >
                                    <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    {isGenerating ? (
                                        <Loader2 size={24} className="animate-spin relative z-10" />
                                    ) : (
                                        <Download size={24} className="relative z-10" />
                                    )}
                                    <span className="relative z-10">{isGenerating ? 'Creating...' : 'Download Card'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}



