"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Trophy, Ghost, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { EditProfileModal } from "./EditProfileModal";

interface ParticipationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ParticipationModal({ isOpen, onClose, onSuccess }: ParticipationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const router = useRouter();

    const handleJoin = async (mode: "normal" | "anonymous") => {
        // If normal mode, we might want to ensure they have an X handle set up first?
        // Ideally, we check profile completeness. For now, we'll just set the mode.
        // If they choose normal, we could prompt them to edit profile if key fields are missing.

        if (mode === 'normal') {
            // Optional: Check if X handle exists? 
            // For simplicity, we just set mode to normal, and if handle is missing, we might prompt later or show "No handle".
            // Let's just proceed.
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/user/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leaderboard_mode: mode
                }),
            });

            if (res.ok) {
                onSuccess();
                onClose();
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to join leaderboard", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isEditProfileOpen) {
        return (
            <EditProfileModal
                isOpen={true}
                onClose={() => {
                    setIsEditProfileOpen(false);
                    // Maybe we check if they filled it out?
                }}
            />
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-background border-border text-foreground">
                <DialogHeader>
                    <div className="mx-auto bg-yellow-500/10 p-3 rounded-full mb-4 w-fit">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-center">Join the Leaderboard</DialogTitle>
                    <DialogDescription className="text-center">
                        Showcase your simulation skills and compete with others globally.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                    {/* Public Option */}
                    <button
                        onClick={() => handleJoin("normal")}
                        disabled={isLoading}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/50 hover:border-twitter-blue/50 transition-all group text-center"
                    >
                        <div className="p-3 bg-twitter-blue/10 rounded-full group-hover:bg-twitter-blue/20 transition-colors">
                            <User className="w-6 h-6 text-twitter-blue" />
                        </div>
                        <div>
                            <h3 className="font-bold">Public Profile</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Show your Name, Avatar, and X Handle. Link to your profile.
                            </p>
                        </div>
                    </button>

                    {/* Anonymous Option */}
                    <button
                        onClick={() => handleJoin("anonymous")}
                        disabled={isLoading}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/50 hover:border-purple-500/50 transition-all group text-center"
                    >
                        <div className="p-3 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-colors">
                            <Ghost className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <h3 className="font-bold">Anonymously</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Appear as "Anonymous User" with a hidden profile.
                            </p>
                        </div>
                    </button>
                </div>

                <div className="text-center text-[11px] text-muted-foreground">
                    You can change this setting at any time in your profile.
                </div>
            </DialogContent>
        </Dialog>
    );
}
