"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { LogOut, User, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface UserProfileProps {
    onLoginClick: () => void;
}

export function UserProfile({ onLoginClick }: UserProfileProps) {
    const { data: session, isPending } = useSession();

    if (isPending) {
        return (
            <div className="flex items-center gap-3 p-3 rounded-full animate-pulse">
                <div className="w-10 h-10 rounded-full bg-secondary" />
                <div className="hidden xl:block space-y-2">
                    <div className="h-4 w-24 bg-secondary rounded" />
                    <div className="h-3 w-16 bg-secondary rounded" />
                </div>
            </div>
        );
    }

    if (!session?.user) {
        return (
            <button
                onClick={onLoginClick}
                className="group flex items-center gap-3 w-full p-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold text-[15px] hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
                <User className="h-5 w-5 xl:hidden" />
                <span className="hidden xl:block mx-auto">Sign in</span>
                <span className="xl:hidden sr-only">Sign in</span>
            </button>
        );
    }

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="group relative flex w-full xl:w-full items-center justify-center xl:justify-start gap-3 p-3 rounded-full hover:bg-twitter-hover transition-colors outline-none cursor-pointer">
                    {/* Avatar */}
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <Avatar className="w-10 h-10 border border-border/50">
                            {session.user.image && <AvatarImage src={session.user.image} className="object-cover" />}
                            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white font-bold">
                                {session.user.name
                                    ? session.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                    : "U"}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {/* Name and handle - only on XL */}
                    <div className="hidden xl:block flex-1 min-w-0 text-left">
                        <p className="font-bold text-[15px] truncate">
                            {session.user.name || "User"}
                        </p>
                        <p className="text-muted-foreground text-sm truncate">
                            @{(session.user as any).username || session.user.name?.replace(/\s+/g, '').toLowerCase() || "user"}
                        </p>
                    </div>

                    {/* Three dots icon - always visible on hover or valid state, but hidden on mobile usually unless we want it */}
                    <MoreHorizontal className="hidden xl:block h-5 w-5 text-muted-foreground ml-auto" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="w-[300px] rounded-xl bg-background border border-border shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-200 mb-4"
                    sideOffset={12}
                    side="top"
                    align="center"
                >
                    <DropdownMenu.Item className="outline-none">
                        <div className="p-3 border-b border-border mb-1 outline-none">
                            <p className="font-bold text-[15px] truncate">
                                {session.user.name || "User"}
                            </p>
                            <p className="text-muted-foreground text-sm truncate">
                                @{(session.user as any).username || session.user.name?.replace(/\s+/g, '').toLowerCase() || "user"}
                            </p>
                        </div>
                    </DropdownMenu.Item>



                    <DropdownMenu.Item
                        onClick={handleSignOut}
                        className="flex items-center gap-3 p-3 text-[15px] font-medium cursor-pointer hover:bg-twitter-hover rounded-lg outline-none transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Log out @{session.user.name?.split(' ')[0] || "user"}
                    </DropdownMenu.Item>

                    <DropdownMenu.Arrow className="fill-border" />
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
