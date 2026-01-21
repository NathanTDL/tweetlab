import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Repeat, Heart, BarChart2, Share, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TweetCardProps {
    name: string;
    handle: string;
    avatar?: string | null;
    time: string;
    content: string;
    comments: number;
    reposts: number;
    likes: number;
    views: number;
    isSimulated?: boolean;
    image?: string | null;
    onDelete?: () => void;
    hideMenu?: boolean;
}

export function TweetCard({ name, handle, avatar, time, content, comments, reposts, likes, views, isSimulated, image, onDelete, hideMenu }: TweetCardProps) {
    return (
        <div className={cn(
            "flex gap-3 px-4 py-3 border-b border-border cursor-pointer hover:bg-twitter-hover transition-colors",
            isSimulated && "animate-in fade-in slide-in-from-top-4 duration-500"
        )}>
            <Link href="/profile" className="shrink-0 cursor-pointer">
                <Avatar className="w-10 h-10 border border-border/50">
                    {avatar && <AvatarImage src={avatar} alt={`@${handle}`} />}
                    <AvatarFallback className="bg-twitter-blue text-white font-bold">
                        {name ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : "U"}
                    </AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-hidden text-[15px]">
                        <span className="font-bold truncate">{name}</span>
                        <span className="text-muted-foreground truncate">@{handle}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground hover:underline">{time}</span>
                    </div>
                    {onDelete ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-full p-1.5 -mr-2 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    ) : !hideMenu && (
                        <button className="text-muted-foreground hover:bg-twitter-blue/10 hover:text-twitter-blue rounded-full p-1.5 -mr-2 transition-colors">
                            <MoreHorizontal size={17} />
                        </button>
                    )}
                </div>

                <div className="mt-0.5 text-[15px] leading-[1.35] whitespace-pre-wrap">
                    {content}
                </div>

                {/* Image Display */}
                {image && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-border">
                        <img
                            src={image}
                            alt="Tweet attachment"
                            className="w-full max-h-[512px] object-cover"
                        />
                    </div>
                )}

                <div className="flex justify-between mt-3 max-w-[425px] text-muted-foreground">
                    {/* Replies */}
                    <div className="flex items-center gap-0.5 group">
                        <button className="p-2 -ml-2 rounded-full group-hover:bg-primary/5 transition-colors">
                            <MessageCircle size={17} className="group-hover:text-foreground transition-colors" />
                        </button>
                        <span className="text-[13px] min-w-[20px] group-hover:text-foreground transition-colors">{comments > 0 && comments}</span>
                    </div>

                    {/* Reposts */}
                    <div className="flex items-center gap-0.5 group">
                        <button className="p-2 -ml-2 rounded-full group-hover:bg-primary/5 transition-colors">
                            <Repeat size={17} className="group-hover:text-foreground transition-colors" />
                        </button>
                        <span className="text-[13px] min-w-[20px] group-hover:text-foreground transition-colors">{reposts > 0 && reposts}</span>
                    </div>

                    {/* Likes */}
                    <div className="flex items-center gap-0.5 group">
                        <button className="p-2 -ml-2 rounded-full group-hover:bg-primary/5 transition-colors">
                            <Heart size={17} className="group-hover:text-foreground transition-colors" />
                        </button>
                        <span className="text-[13px] min-w-[20px] group-hover:text-foreground transition-colors">{likes > 0 && likes}</span>
                    </div>

                    {/* Views */}
                    <div className="flex items-center gap-0.5 group">
                        <button className="p-2 -ml-2 rounded-full group-hover:bg-primary/5 transition-colors">
                            <BarChart2 size={17} className="group-hover:text-foreground transition-colors" />
                        </button>
                        <span className="text-[13px] min-w-[20px] group-hover:text-foreground transition-colors">{views > 0 && views}</span>
                    </div>

                    {/* Share */}
                    <div className="flex items-center">
                        <button className="p-2 -ml-2 rounded-full hover:bg-primary/5 hover:text-foreground transition-colors">
                            <Share size={17} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
