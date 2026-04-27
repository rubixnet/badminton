"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/homepage/theme-toggle";
import { cn } from "@/lib/utils"; 

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border/40">
            <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center justify-between">
                <Link href="/" className="font-medium tracking-tight text-sm text-foreground/90 hover:text-primary transition-colors">
                    Badminton Tracker
                </Link>

                <div className="hidden sm:flex items-center">
                    <div className="flex items-center gap-5 text-sm mr-2">
                        <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                        <Link href="#story" className="text-muted-foreground hover:text-foreground transition-colors">Our Story</Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-px bg-border/50 " />
                        <div className="w-9 h-9 flex items-center justify-center">
                            {mounted ? <ThemeToggle /> : <div className="w-4 h-4" />}
                        </div>
                        <div className="h-4 w-px bg-border/50" />
                        <Link href="/login" className={buttonVariants({ variant: "default", size: "sm", className: "rounded-md shadow-none font-medium h-9 px-5" })}>
                            Try it free
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:hidden">
                    {mounted && <ThemeToggle />}
                    <button
                        className="p-2 -mr-2 text-muted-foreground"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle Menu"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <div className={cn(
                "absolute top-full left-0 w-full bg-background border-b border-border p-6 flex flex-col gap-4 transition-all duration-300 ease-in-out sm:hidden",
                isMobileMenuOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-4 invisible pointer-events-none"
            )}>
                <Link 
                    href="#features" 
                    onClick={closeMenu}
                    className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    Features
                </Link>
                <Link 
                    href="#story" 
                    onClick={closeMenu}
                    className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    Our Story
                </Link>
                <hr className="border-border/50" />
                <Link 
                    href="/login" 
                    onClick={closeMenu}
                    className={buttonVariants({ variant: "default", size: "lg", className: "w-full justify-center" })}
                >
                    Try it free
                </Link>
            </div>
        </nav>
    )
}