"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Timeline } from "@/components/tweetlab/Timeline";
import { AnalysisPanel } from "@/components/tweetlab/AnalysisPanel";
import { AIChat } from "@/components/tweetlab/AIChat";
import { Home, MessageSquare, Feather, Sparkles, History as HistoryIcon, User, FlaskConical, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/tweetlab/ThemeToggle";
import { TweetAnalysis } from "@/lib/types";
import Image from "next/image";
import { LoginModal } from "@/components/tweetlab/LoginModal";
import { UserProfile } from "@/components/tweetlab/UserProfile";
import { History } from "@/components/tweetlab/History";
import { useSession } from "@/lib/auth-client";
import { Leaderboard } from "@/components/tweetlab/Leaderboard";
import { ProfileView } from "@/components/tweetlab/ProfileView";
import { SuperXPromo } from "@/components/tweetlab/SuperXPromo";

export default function Page() {
  const [analysis, setAnalysis] = useState<TweetAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTweet, setCurrentTweet] = useState<string>("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'timeline' | 'leaderboard' | 'profile'>('timeline');

  const handleHistorySelect = (item: any) => {
    setSelectedHistoryItem(item);
    if (item.analysis) {
      setAnalysis(item.analysis);
    }
    // Mobile close behavior
    if (window.innerWidth < 1280) {
      setIsHistoryOpen(false);
    }
    // Switch back to timeline to see the result if we were in leaderboard
    if (currentView === 'leaderboard' || currentView === 'profile') {
      setCurrentView('timeline');
    }
  };

  const { data: session } = useSession();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (window.innerWidth < 1280) return;

      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (isChatOpen) setIsChatOpen(false);
        if (isHistoryOpen) setIsHistoryOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isChatOpen, isHistoryOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle regeneration of variants with optional instruction
  const handleRegenerate = async (instruction?: string) => {
    if (!currentTweet) return;

    setIsRegenerating(true);
    try {
      // Build the prompt with optional instruction
      const tweetToAnalyze = instruction
        ? `${currentTweet}\n\n[User instruction: ${instruction}]`
        : currentTweet;

      const response = await fetch('/api/simulate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweet: tweetToAnalyze }),
      });

      if (!response.ok) throw new Error('Failed to regenerate');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.complete && data.analysis) {
                setAnalysis(data.analysis);
              }
            } catch { }
          }
        }
      }
    } catch (error) {
      console.error('Regeneration error:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-background text-foreground selection:bg-amber-500/30 transition-colors duration-300">
      <div className="flex w-full max-w-[1400px] justify-center">
        {/* Left Sidebar (Nav + AI Chat) */}
        <header ref={sidebarRef} className="hidden sm:flex w-[72px] xl:w-[300px] shrink-0 flex-col p-2 h-screen sticky top-0 overflow-hidden border-r border-border transition-all">
          <div className="flex flex-col h-full w-full px-2">
            <div className="flex flex-col gap-1 w-full items-center xl:items-start shrink-0">
              {/* Logo */}
              <button
                onClick={() => setCurrentView('timeline')}
                className="p-3 mb-2 rounded-full hover:bg-amber-500/10 w-fit transition-colors cursor-pointer flex items-center gap-3"
              >
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <FlaskConical className="w-7 h-7 text-yellow-500" strokeWidth={2.5} />
                </div>
                <span className="hidden xl:block text-xl font-bold tracking-tight">
                  TweetLab
                </span>
              </button>

              {/* Nav Items - Hidden when Chat or History is open */}
              {!isChatOpen && !isHistoryOpen && (
                <nav className="flex flex-col gap-2 mt-1 w-full mb-4 items-center xl:items-start animate-in fade-in slide-in-from-top-2 duration-300">
                  <button
                    onClick={() => {
                      setCurrentView('timeline');
                      setIsChatOpen(false);
                    }}
                    className={`group flex items-center justify-center xl:justify-start gap-4 p-3 rounded-full w-fit xl:w-full transition-colors hover:bg-amber-500/10 ${currentView === 'timeline' && !isChatOpen ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Home className="h-[26px] w-[26px]" strokeWidth={currentView === 'timeline' && !isChatOpen ? 2.5 : 1.75} />
                    <span className="hidden xl:block text-xl">Home</span>
                  </button>

                  <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`group flex items-center justify-center xl:justify-start gap-4 p-3 rounded-full w-fit xl:w-full transition-colors hover:bg-amber-500/10 ${isChatOpen ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <MessageSquare className="h-[26px] w-[26px]" strokeWidth={isChatOpen ? 2.5 : 1.75} />
                    <span className="hidden xl:block text-xl">AI Chat</span>
                  </button>

                  {/* Leaderboard Button */}
                  <button
                    onClick={() => {
                      setCurrentView('leaderboard');
                      setIsChatOpen(false);
                    }}
                    className={`group flex items-center justify-center xl:justify-start gap-4 p-3 rounded-full w-fit xl:w-full transition-colors hover:bg-amber-500/10 ${currentView === 'leaderboard' ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Trophy className="h-[26px] w-[26px]" strokeWidth={currentView === 'leaderboard' ? 2.5 : 1.75} />
                    <span className="hidden xl:block text-xl">Leaderboard</span>
                  </button>

                  {/* Profile Button */}
                  {session?.user ? (
                    <button
                      onClick={() => setCurrentView('profile')}
                      className={`group flex items-center justify-center xl:justify-start gap-4 p-3 rounded-full hover:bg-amber-500/10 w-fit xl:w-full transition-colors ${currentView === 'profile' ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <User className="h-[26px] w-[26px]" strokeWidth={currentView === 'profile' ? 2.5 : 1.75} />
                      <span className="hidden xl:block text-xl">Profile</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="group flex items-center justify-center xl:justify-start gap-4 p-3 rounded-full hover:bg-amber-500/10 w-fit xl:w-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <User className="h-[26px] w-[26px]" strokeWidth={1.75} />
                      <span className="hidden xl:block text-xl">Profile</span>
                    </button>
                  )}

                  {/* History button - only show if logged in */}
                  {session?.user && (
                    <button
                      onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                      className={`group flex items-center justify-center xl:justify-start gap-4 p-3 rounded-full w-fit xl:w-full transition-colors hover:bg-amber-500/10 ${isHistoryOpen ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <HistoryIcon className="h-[26px] w-[26px]" strokeWidth={isHistoryOpen ? 2.5 : 1.75} />
                      <span className="hidden xl:block text-xl">History</span>
                    </button>
                  )}
                </nav>
              )}
            </div>

            {/* Inline AI Chat (Desktop XL only) - Maximized */}
            {isChatOpen && (
              <div className="flex-1 min-h-0 w-full mb-4 border border-border rounded-2xl overflow-hidden shadow-sm xl:block hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                <AIChat
                  isOpen={true}
                  currentTweet={currentTweet}
                />
              </div>
            )}

            {/* Inline History (Desktop XL only) */}
            {isHistoryOpen && session?.user && !isChatOpen && (
              <div className="flex-1 min-h-0 w-full mb-4 border border-border rounded-2xl overflow-hidden shadow-sm xl:block hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                <History onSelectHistory={handleHistorySelect} />
              </div>
            )}

            {/* Tablet icon-only chat indicator */}
            {isChatOpen && (
              <div className="xl:hidden hidden sm:flex w-full justify-center pt-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center animate-pulse">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            )}

            {/* Bottom section: Theme toggle + User Profile */}
            {/* Always show profile section at bottom */}
            <div className="pb-4 mt-auto w-full space-y-3 shrink-0">
              <div className="flex justify-center xl:justify-start">
                <ThemeToggle />
              </div>
              <UserProfile onLoginClick={() => setIsLoginModalOpen(true)} />
            </div>
          </div>
        </header>

        {/* Center Timeline / Leaderboard / Profile */}
        <main className="flex w-full xl:max-w-[600px] lg:max-w-[600px] md:max-w-[600px] max-w-full flex-col border-x border-border min-h-screen sm:pb-0 pb-[60px]">
          {currentView === 'timeline' ? (
            <Timeline
              onAnalysisUpdate={setAnalysis}
              onLoadingChange={setIsLoading}
              onTweetChange={setCurrentTweet}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              isChatOpen={isChatOpen}
              onScrollToTop={scrollToTop}
              selectedHistoryItem={selectedHistoryItem}
              onLoginClick={() => setIsLoginModalOpen(true)}
              isLoading={isLoading}
            />
          ) : currentView === 'leaderboard' ? (
            <Leaderboard />
          ) : (
            <ProfileView onBack={() => setCurrentView('timeline')} />
          )}
        </main>

        {/* Right Sidebar (Search/Analysis) - Always visible */}
        <aside className="hidden lg:flex w-[380px] shrink-0 flex-col gap-4 p-4 pl-6 h-screen sticky top-0 overflow-y-auto">
          {/* If Profile View, Show SuperX Promo. If Timeline, Show Analysis */}
          {currentView === 'timeline' ? (
            <AnalysisPanel
              analysis={analysis}
              isLoading={isLoading}
              onRegenerate={handleRegenerate}
              isRegenerating={isRegenerating}
            />
          ) : (
            <div className="mt-2">
              <SuperXPromo />
            </div>
          )}
        </aside>
      </div>

      {/* Mobile/Tablet AI Chat Overlay */}
      {isChatOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm xl:hidden flex items-start sm:items-center justify-center pt-0 pb-[60px] sm:p-4">
          <div className="absolute inset-0" onClick={() => setIsChatOpen(false)} />
          <div className="relative w-full h-full sm:h-[600px] sm:max-w-[400px] bg-background sm:border sm:border-border sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur z-10 shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                AI Assistant
              </h3>
              <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-secondary rounded-full sm:block hidden">
                <Feather className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <AIChat
                isOpen={true}
                currentTweet={currentTweet}
                hideHeader={true}
                autoFocus={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile/Tablet History Overlay */}
      {isHistoryOpen && session?.user && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm xl:hidden flex items-start sm:items-center justify-center pt-0 pb-[60px] sm:p-4">
          <div className="absolute inset-0" onClick={() => setIsHistoryOpen(false)} />

          <div className="relative w-full h-full sm:h-[600px] sm:max-w-[400px] bg-background sm:border sm:border-border sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur z-10 shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <HistoryIcon className="h-5 w-5 text-amber-500" />
                Your History
              </h3>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-secondary rounded-full sm:block hidden">
                <Feather className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-0 relative">
              <History onSelectHistory={handleHistorySelect} hideHeader={true} />
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Mobile Bottom Navigation - Fixed at bottom */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-background/80 backdrop-blur-md border-t border-border flex items-center justify-around z-50 pb-safe">
        <button
          onClick={() => {
            setIsChatOpen(false);
            setIsHistoryOpen(false);
            setCurrentView('timeline');
            scrollToTop();
          }}
          className={`flex flex-col items-center justify-center p-2 w-full h-full transition-colors ${!isChatOpen && !isHistoryOpen && currentView === 'timeline' ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Home className="h-6 w-6" strokeWidth={!isChatOpen && !isHistoryOpen && currentView === 'timeline' ? 2.5 : 2} />
        </button>

        <button
          onClick={() => {
            setIsChatOpen(false);
            setIsHistoryOpen(false);
            setCurrentView('leaderboard');
          }}
          className={`flex flex-col items-center justify-center p-2 w-full h-full transition-colors ${currentView === 'leaderboard' ? "text-yellow-500" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Trophy className="h-6 w-6" strokeWidth={currentView === 'leaderboard' ? 2.5 : 2} />
        </button>

        <button
          onClick={() => {
            setIsChatOpen(true);
            setIsHistoryOpen(false);
          }}
          className={`flex flex-col items-center justify-center p-2 w-full h-full transition-colors ${isChatOpen ? "text-amber-500" : "text-muted-foreground hover:text-foreground"}`}
        >
          <MessageSquare className="h-6 w-6" strokeWidth={isChatOpen ? 2.5 : 2} />
        </button>

        {session?.user && (
          <button
            onClick={() => {
              setIsHistoryOpen(true);
              setIsChatOpen(false);
            }}
            className={`flex flex-col items-center justify-center p-2 w-full h-full transition-colors ${isHistoryOpen ? "text-amber-500" : "text-muted-foreground hover:text-foreground"}`}
          >
            <HistoryIcon className="h-6 w-6" strokeWidth={isHistoryOpen ? 2.5 : 2} />
          </button>
        )}

        {session?.user ? (
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center justify-center p-2 w-full h-full text-muted-foreground hover:text-foreground transition-colors ${currentView === 'profile' ? "text-foreground" : "text-muted-foreground"}`}
          >
            <User className="h-6 w-6" strokeWidth={currentView === 'profile' ? 2.5 : 2} />
          </button>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex flex-col items-center justify-center p-2 w-full h-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <User className="h-6 w-6" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
