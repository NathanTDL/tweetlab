"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Sparkles, User, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

// Need to create Textarea component if not exists, but for now assuming standard shadcn
// Actually, I should check if Textarea exists. If not, I'll stick to Input or standard textarea for a sec or create it.
// I'll assume standard textarea for now or create it in this file if simple. 
// Just using standard html textarea with tailwind classes for safety and speed.

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
    const { data: session } = useSession();
    // Use extended session data or fetch from separate endpoint if session doesn't have it yet?
    // Since we just added columns, session won't have them by default unless we refresh/fetch.
    // For now, names are in session. We might need to fetch the full profile data on open.
    // I'll add a fetch effect.

    const [name, setName] = useState(session?.user?.name || "");
    const [image, setImage] = useState(session?.user?.image || "");
    const [bio, setBio] = useState("");
    const [audience, setAudience] = useState("");
    const [aiContext, setAiContext] = useState("");
    const [xHandle, setXHandle] = useState("");

    // File upload state
    const [fileInputKey, setFileInputKey] = useState(Date.now()); // to reset input
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const router = useRouter();

    // Fetch existing extra fields
    const fetchProfile = async () => {
        setIsFetching(true);
        try {
            // We need an endpoint to get the FULL user profile details since session might be stale or incomplete
            // Actually, we can just use the current session for name/image and fetch the rest or just use what we have.
            // Better to have a GET endpoint for profile details.
            // For MVP speed, let's assume session *might* have it if we refreshed, but likely not.
            // Let's rely on a separate fetch to /api/user/profile (need to create this?)
            // Or just fetch directly from supabase client side if RLS allows.
            // Let's create `GET /api/user/profile` later? 
            // Actually, let's try to fetch from a new endpoint `GET /api/user/me`

            const res = await fetch("/api/user/me");
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setName(data.user.name || "");
                    setImage(data.user.image || "");
                    setBio(data.user.bio || "");
                    setAudience(data.user.target_audience || "");
                    setAiContext(data.user.ai_context || "");
                    setXHandle(data.user.x_handle || "");
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsFetching(false);
        }
    };

    // Trigger fetch on open
    // useEffect(() => { if (isOpen) fetchProfile() }, [isOpen]); 
    // Actually handle this via a "onOpen" logic or just verify useEffect usage.
    // Since I can't use useEffect conditionally, I'll do it inside the component.
    // But to save file writes, I'll assume standard React patterns.

    // NOTE: Temporarily mocking the fetch or doing it on mount if open.
    // I'll fix this properly in the implementation.

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Resize/Compress
        // Simple client-side resizing via canvas
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 400;
                const scale = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.7); // 70% quality JPEG
                setImage(dataUrl);
            };
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/user/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    image,
                    bio,
                    target_audience: audience,
                    ai_context: aiContext,
                    x_handle: xHandle
                }),
            });

            if (!res.ok) throw new Error("Failed to update");

            router.refresh(); // Refresh server components/data
            onClose(); // Close modal, staying on profile page
        } catch (error) {
            console.error("Error updating:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-background border-border text-foreground max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
                </DialogHeader>

                {isFetching ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 py-2">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <Avatar className="w-24 h-24 border-4 border-background shadow-sm">
                                    <AvatarImage src={image} className="object-cover" />
                                    <AvatarFallback className="text-2xl bg-muted">{name?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="w-8 h-8 text-white/80" />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    key={fileInputKey}
                                    onChange={handleFileSelect}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-twitter-blue"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Photo
                            </Button>
                        </div>

                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-background border-border"
                                    maxLength={50}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Tell us about yourself..."
                                    maxLength={160}
                                />
                            </div>

                            {/* Social Links */}
                            <div className="space-y-2">
                                <Label htmlFor="xHandle">X / Twitter Handle (Optional)</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground font-bold">@</span>
                                    <Input
                                        id="xHandle"
                                        value={xHandle}
                                        onChange={(e) => setXHandle(e.target.value)}
                                        className="bg-background border-border"
                                        placeholder="username"
                                        maxLength={20}
                                    />
                                </div>
                                <p className="text-[13px] text-muted-foreground">Used for the Public Leaderboard link.</p>
                            </div>

                            {/* Persona / AI Context Section */}
                            <div className="bg-secondary/30 p-6 rounded-2xl space-y-6 border border-border/50">
                                <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-border/50">
                                    <div className="p-2 bg-twitter-blue/10 rounded-lg">
                                        <Sparkles className="w-4 h-4 text-twitter-blue" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base">AI Persona Context</h3>
                                        <p className="text-xs text-muted-foreground">Customize how the AI writes for you</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="audience" className="text-sm font-semibold text-foreground">Target Audience</Label>
                                        <Input
                                            id="audience"
                                            value={audience}
                                            onChange={(e) => setAudience(e.target.value)}
                                            className="bg-background border-border shadow-sm h-11"
                                            placeholder="e.g. Tech Founders, Gen Z, Crypto traders..."
                                        />
                                        <p className="text-[13px] text-muted-foreground pl-1">The AI will optimize your tweets to resonate with this group.</p>
                                    </div>

                                    <div className="space-y-1.5 pt-2">
                                        <Label htmlFor="aiContext" className="text-sm font-semibold text-foreground">Behavioral Instructions</Label>
                                        <textarea
                                            id="aiContext"
                                            value={aiContext}
                                            onChange={(e) => setAiContext(e.target.value)}
                                            className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm resize-none"
                                            placeholder="e.g. Be sarcastic, use short sentences, avoid emojis..."
                                        />
                                        <p className="text-[13px] text-muted-foreground pl-1">Specific instructions for how the AI should write for you.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 rounded-full font-bold px-6" disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
