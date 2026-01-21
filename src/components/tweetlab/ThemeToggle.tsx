"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("dark");

    useEffect(() => {
        // Check initial preference
        if (document.documentElement.classList.contains("dark")) {
            setTheme("dark");
        } else {
            setTheme("light");
        }
    }, []);

    const toggleTheme = () => {
        if (theme === "dark") {
            document.documentElement.classList.remove("dark");
            setTheme("light");
        } else {
            document.documentElement.classList.add("dark");
            setTheme("dark");
        }
    };

    return (
        <Button
            variant="ghost"
            onClick={toggleTheme}
            className="flex items-center gap-3 rounded-full px-3 py-2.5 h-auto w-fit hover:bg-twitter-hover text-foreground transition-colors"
        >
            {theme === "dark" ? (
                <>
                    <Moon className="h-[22px] w-[22px]" />
                    <span className="hidden xl:block text-[15px]">Dark Mode</span>
                </>
            ) : (
                <>
                    <Sun className="h-[22px] w-[22px]" />
                    <span className="hidden xl:block text-[15px]">Light Mode</span>
                </>
            )}
        </Button>
    );
}
