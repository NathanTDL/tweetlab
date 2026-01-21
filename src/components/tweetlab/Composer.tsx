import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { ImagePlus, X, Pencil } from "lucide-react";

interface TweetComposerProps {
    onPost?: (content: string, imageData?: { base64: string; mimeType: string }) => void;
    isLoading?: boolean;
}

export function TweetComposer({ onPost, isLoading }: TweetComposerProps) {
    const { data: session } = useSession();
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_CHARS = 280;
    const charCount = content.length;
    const charsRemaining = MAX_CHARS - charCount;
    const isOverLimit = charCount > MAX_CHARS;

    // Auto-expand textarea as content grows
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [content]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleEditImage = () => {
        fileInputRef.current?.click();
    };

    const handlePostClick = async () => {
        if (content.trim() && onPost) {
            let imageData: { base64: string; mimeType: string } | undefined;

            if (imageFile && imagePreview) {
                const base64 = imagePreview.split(",")[1];
                imageData = {
                    base64,
                    mimeType: imageFile.type,
                };
            }

            onPost(content, imageData);
            setContent("");
            handleRemoveImage();
        }
    };

    // Calculate progress circle for character count
    const progress = Math.min(charCount / MAX_CHARS, 1);
    const circumference = 2 * Math.PI * 10;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div className="flex gap-3 p-4 border-b border-border w-full">
            <div className="shrink-0">
                <Avatar className="w-10 h-10 border border-border/50">
                    {session?.user?.image && (
                        <AvatarImage src={session.user.image} alt={session.user.name || "@user"} />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white font-bold">
                        {session?.user?.name
                            ? session.user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                            : "U"}
                    </AvatarFallback>
                </Avatar>
            </div>
            <div className="w-full pt-1 flex flex-col">
                <textarea
                    ref={textareaRef}
                    className="w-full bg-transparent text-xl placeholder:text-muted-foreground border-none focus:ring-0 resize-none outline-none min-h-[52px]"
                    placeholder="What is happening?!"
                    rows={1}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                {/* Image Preview - X-like styling */}
                {imagePreview && (
                    <div className="relative mt-3 rounded-2xl overflow-hidden border border-border group">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-h-[512px] object-cover"
                        />
                        {/* Overlay buttons */}
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button
                                onClick={handleEditImage}
                                className="bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
                                title="Edit"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleRemoveImage}
                                className="bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
                                title="Remove"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                />

                {/* Sticky Actions Row - like X */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border sticky bottom-0 bg-background">
                    {/* Left: Media icons */}
                    <div className="flex items-center gap-0">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-full hover:bg-yellow-500/10 text-yellow-500 transition-colors"
                            title="Attach image"
                        >
                            <ImagePlus className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Right: Character counter + Post button */}
                    <div className="flex items-center gap-3">
                        {/* Circular progress indicator like X */}
                        {charCount > 0 && (
                            <div className="flex items-center gap-2">
                                {charCount > MAX_CHARS - 20 && (
                                    <span className={`text-sm font-medium ${isOverLimit ? "text-red-500" : charCount > MAX_CHARS - 20 ? "text-yellow-500" : "text-muted-foreground"}`}>
                                        {charsRemaining}
                                    </span>
                                )}
                                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="text-border"
                                    />
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        className={isOverLimit ? "text-red-500" : charCount > MAX_CHARS - 20 ? "text-yellow-500" : "text-yellow-500"}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        )}
                        <Button
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold rounded-full px-5 h-9 disabled:opacity-50 shadow-sm hover:shadow-md transition-all"
                            onClick={handlePostClick}
                            disabled={!content.trim() || isLoading}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Post"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
