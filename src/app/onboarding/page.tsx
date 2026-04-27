"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Onboarding() {
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [groupName, setGroupName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [workosId, setWorkosId] = useState("");
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [generatedInviteCode, setGeneratedInviteCode] = useState("");
    const [copied, setCopied] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    
    const inviteCode = searchParams.get("invite");
    const finalizeUser = useMutation(api.users.finalizeUser);
    const createGroup = useMutation(api.group.createGroup);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch("/api/auth/me", { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    setUserEmail(data.email);
                    setWorkosId(data.userId);
                } else {
                    router.push("/login");
                }
            } catch (error) {
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, [router]);

    const handleComplete = async () => {
        if (!name.trim()) {
            setError("Please enter your name");
            return;
        }
        
        if (!inviteCode && !groupName.trim()) {
            setError("Please name your club");
            return;
        }

        setSubmitting(true);
        setError(null);
        
        try {
            const userId = await finalizeUser({
                name,
                email: userEmail,
                workosId: workosId, 
                inviteCode: inviteCode || undefined,
            });

            if (!inviteCode) {
                const newGroup = await createGroup({ name: groupName, adminId: userId });
                setGeneratedInviteCode(newGroup?.inviteCode || "new-club-link");
                setSubmitting(false);
                setStep(3);
            } else {
                router.push("/");
            }
        } catch (e: any) {
            setError(e.message || "Setup failed. Please try again.");
            setSubmitting(false);
        }
    };

    const copyToClipboard = () => {
        const link = `${window.location.origin}/invite/${generatedInviteCode}?via=${workosId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    const slideVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 selection:bg-primary/20">
            <div className="absolute top-12 flex items-center gap-3">
                {[1, 2, 3].map((i) => (
                    <div 
                        key={i} 
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-500",
                            step === i ? "w-8 bg-primary" : step > i ? "w-4 bg-primary/40" : "w-4 bg-muted"
                        )}
                        style={{ display: inviteCode && i === 3 ? 'none' : 'block' }}
                    />
                ))}
            </div>

            <div className="w-full max-w-md">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1" 
                            variants={slideVariants}
                            initial="hidden" animate="visible" exit="exit" 
                            className="space-y-8"
                        >
                            <div className="space-y-3 text-center">
                                <h1 className="text-4xl font-medium tracking-tight text-foreground/90">Welcome to the court.</h1>
                                <p className="text-muted-foreground text-lg">What should we call you?</p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                            
                            <div className="space-y-6 pt-4">
                                <input 
                                    type="text"
                                    placeholder="Your display name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(2)}
                                    className="w-full px-5 py-4 text-lg rounded-xl border border-border/50 bg-muted/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                                    autoFocus
                                />
                                <Button 
                                    onClick={() => !name.trim() ? setError("Please enter your name") : setStep(2)}
                                    disabled={!name.trim()}
                                    className="w-full h-14 rounded-xl font-medium text-base shadow-none"
                                >
                                    Continue
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            key="step2" 
                            variants={slideVariants}
                            initial="hidden" animate="visible" exit="exit"
                            className="space-y-8"
                        >
                            <div className="space-y-3 text-center">
                                <h1 className="text-4xl font-medium tracking-tight text-foreground/90">
                                    {inviteCode ? "Ready to play?" : "Create your club."}
                                </h1>
                                <p className="text-muted-foreground text-lg">
                                    {inviteCode 
                                        ? `Join the group as ${name}` 
                                        : "Give your friend group a name to get started."}
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                            
                            <div className="space-y-6 pt-4">
                                {!inviteCode && (
                                    <input 
                                        type="text"
                                        placeholder="e.g. Weekend Smashers"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && groupName.trim() && handleComplete()}
                                        className="w-full px-5 py-4 text-lg rounded-xl border border-border/50 bg-muted/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                                        autoFocus
                                    />
                                )}
                                
                                <div className="flex gap-3">
                                    <Button 
                                        onClick={() => setStep(1)}
                                        variant="outline"
                                        className="w-24 h-14 rounded-xl font-medium border-border/50"
                                    >
                                        Back
                                    </Button>
                                    <Button 
                                        onClick={handleComplete}
                                        disabled={submitting || (!inviteCode && !groupName.trim())}
                                        className="flex-1 h-14 rounded-xl font-medium shadow-none"
                                    >
                                        {submitting 
                                            ? "Setting up..." 
                                            : inviteCode ? "Join Club" : "Create Club"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div 
                            key="step3" 
                            variants={slideVariants}
                            initial="hidden" animate="visible" exit="exit"
                            className="space-y-8"
                        >
                            <div className="space-y-3 text-center">
                                <h1 className="text-4xl font-medium tracking-tight text-foreground/90">
                                    You're in.
                                </h1>
                                <p className="text-muted-foreground text-lg">
                                    Invite your friends now, or do it later from the dashboard.
                                </p>
                            </div>

                            <div className="p-6 bg-muted/20 border border-border/50 rounded-2xl space-y-4">
                                <p className="text-sm font-medium text-foreground/80">Your invite link</p>
                                <div className="flex items-center gap-2">
                                    <div className="h-12 flex-1 bg-background border border-border/50 rounded-xl px-4 flex items-center overflow-hidden">
                                        <span className="text-sm text-muted-foreground truncate select-none">
                                            badminton-tracker.app/invite/{generatedInviteCode}
                                        </span>
                                    </div>
                                    <Button 
                                        onClick={copyToClipboard}
                                        variant={copied ? "secondary" : "default"}
                                        className={cn(
                                            "h-12 px-4 rounded-xl transition-all shadow-none",
                                            copied && "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                        )}
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <Button 
                                onClick={() => router.push("/")}
                                className="w-full h-14 rounded-xl font-medium shadow-none group"
                            >
                                Go to Dashboard
                                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}