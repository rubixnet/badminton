"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Onboarding() {
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [groupName, setGroupName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [workosId, setWorkosId] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const inviteCode = searchParams.get("invite");
    const finalizeUser = useMutation(api.users.finalizeUser);
    const createGroup = useMutation(api.group.createGroup);

    // Fetch current user data from session
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
            setError("Please enter a group name");
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
                await createGroup({ name: groupName, adminId: userId });
            }

            router.push("/");
        } catch (e: any) {
            setError(e.message || "Setup failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="w-full max-w-md">
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div 
                            key="step1" 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -20 }} 
                            className="space-y-8"
                        >
                            <div className="space-y-2 text-center">
                                <h1 className="text-3xl font-bold tracking-tight">Let's get started</h1>
                                <p className="text-muted-foreground">What's your name?</p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                            
                            <div className="space-y-6">
                                <input 
                                    type="text"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && setStep(2)}
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    autoFocus
                                />
                                <Button 
                                    onClick={() => !name.trim() ? setError("Please enter your name") : setStep(2)}
                                    disabled={!name.trim()}
                                    className="w-full h-12 rounded-full font-medium"
                                >
                                    Next
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="step2" 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="space-y-2 text-center">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    {inviteCode ? "Join the group!" : "Create your badminton club"}
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    {inviteCode 
                                        ? "You've been invited to join a group" 
                                        : "Set up your group to start tracking matches"}
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                            
                            <div className="space-y-6">
                                {!inviteCode && (
                                    <input 
                                        type="text"
                                        placeholder="Club name (e.g. Smash Kings)"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleComplete()}
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        autoFocus
                                    />
                                )}
                                
                                <div className="flex gap-3">
                                    <Button 
                                        onClick={() => setStep(1)}
                                        variant="outline"
                                        className="flex-1 h-12 rounded-full font-medium"
                                    >
                                        Back
                                    </Button>
                                    <Button 
                                        onClick={handleComplete}
                                        disabled={submitting || (!inviteCode && !groupName.trim())}
                                        className="flex-1 h-12 rounded-full font-medium bg-primary hover:bg-primary/90"
                                    >
                                        {submitting ? "Setting up..." : inviteCode ? "Join Now" : "Create Club"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-8 text-center text-xs text-muted-foreground">
                    <p>Step {step} of 2</p>
                </div>
            </div>
        </div>
    );
}
