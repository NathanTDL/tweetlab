"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/lib/types";
import ReactMarkdown from "react-markdown";

interface AIChatProps {
    isOpen: boolean;
    currentTweet?: string;
    hideHeader?: boolean;
    autoFocus?: boolean;
}

export function AIChat({ isOpen, currentTweet, hideHeader, autoFocus = true }: AIChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && autoFocus) {
            inputRef.current?.focus();
        }
    }, [isOpen, autoFocus]);

    const handleSend = async (directMessage?: string) => {
        const messageToSend = directMessage || input.trim();
        if (!messageToSend || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: messageToSend,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageToSend,
                    tweetContext: currentTweet,
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I couldn't process that. Please try again.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
            {/* Header - Only show if not hidden */}
            {!hideHeader && (
                <div className="flex items-center gap-2 p-3 border-b border-border bg-secondary/30 shrink-0">
                    <div className="p-1 min-w-[24px] bg-amber-500/10 rounded-lg">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="font-bold text-[14px] leading-tight">AI Assistant</h2>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                            Refine your tweets
                        </p>
                    </div>
                </div>
            )}

            {/* Current Tweet Context */}
            {currentTweet && (
                <div className="px-3 py-2 bg-secondary/20 border-b border-border shrink-0">
                    <p className="text-[11px] text-muted-foreground mb-0.5">Current tweet:</p>
                    <p className="text-[12px] line-clamp-2 leading-tight opacity-80">{currentTweet}</p>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center mb-3">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                        </div>
                        <h3 className="font-semibold text-[14px] mb-1">How can I help?</h3>
                        <div className="flex flex-col gap-1.5 w-full">
                            {["Make it shorter", "Add more hook", "Make it bolder"].map(
                                (suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => handleSend(suggestion)}
                                        disabled={isLoading}
                                        className="text-[12px] px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-xl border border-border transition-colors text-left disabled:opacity-50"
                                    >
                                        {suggestion}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`max-w-[90%] px-3 py-2 rounded-2xl text-[13px] leading-snug ${message.role === "user"
                                ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-br-sm"
                                : "bg-secondary rounded-bl-sm"
                                }`}
                        >
                            <ReactMarkdown
                                components={{
                                    p: ({ node, ...props }) => <p {...props} className="mb-1 last:mb-0 leading-relaxed" />,
                                    ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-4 mb-2 last:mb-0 space-y-0.5" />,
                                    ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-4 mb-2 last:mb-0 space-y-0.5" />,
                                    li: ({ node, ...props }) => <li {...props} className="pl-0.5" />,
                                    strong: ({ node, ...props }) => <span {...props} className="font-bold" />,
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-secondary px-3 py-2 rounded-2xl rounded-bl-sm">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-background shrink-0">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type..."
                        className="flex-1 bg-secondary border border-border rounded-full px-3 py-2 text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-transparent transition-all min-w-0"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-full h-[34px] w-[34px] p-0 disabled:opacity-50 shrink-0"
                    >
                        <Send size={14} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
