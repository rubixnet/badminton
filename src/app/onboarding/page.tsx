"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Activity, 
  ShieldAlert, 
  Database,
  ChevronRight,
  ChevronLeft,
  Check,
  TrendingUp,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar,
  XAxis,
  YAxis
} from "recharts";


const comebackData = [
  { point: 1, p1: 0, p2: 5 },
  { point: 2, p1: 2, p2: 11 },
  { point: 3, p1: 8, p2: 14 },
  { point: 4, p1: 15, p2: 16 },
  { point: 5, p1: 21, p2: 19 },
];

const radarData = [
  { subject: 'Win %', A: 85, fullMark: 100 },
  { subject: 'Stamina', A: 65, fullMark: 100 },
  { subject: 'Smashes', A: 90, fullMark: 100 },
  { subject: 'Defense', A: 70, fullMark: 100 },
  { subject: 'Net Play', A: 60, fullMark: 100 },
];


const LocalFirstPreview = () => (
  <div className="w-full h-full flex flex-col items-center justify-center space-y-6 p-8">
    <div className="relative w-32 h-32 flex items-center justify-center">
      <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full animate-[spin_10s_linear_infinite]" />
      <div className="absolute inset-2 border-2 border-primary/20 rounded-full animate-[spin_7s_linear_infinite_reverse]" />
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 backdrop-blur-sm z-10">
        <Database className="w-8 h-8 text-primary" />
      </div>
    </div>
    <div className="space-y-3 w-full max-w-xs">
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background shadow-sm">
        <span className="text-sm font-medium">Match Saved</span>
        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-1">
          <Zap className="w-3 h-3" /> 0ms
        </span>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background shadow-sm opacity-60">
        <span className="text-sm font-medium text-muted-foreground">Server Sync</span>
        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
          Pending
        </span>
      </div>
    </div>
  </div>
);

const CheckpointsPreview = () => (
  <div className="w-full h-full flex flex-col p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">P1</div>
        <div className="text-2xl font-black tabular-nums tracking-tighter">21</div>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-full mb-1">Epic Comeback</span>
        <span className="text-xs text-muted-foreground">Final Score</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-2xl font-black tabular-nums tracking-tighter text-muted-foreground">19</div>
        <div className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground font-bold">P2</div>
      </div>
    </div>
    <div className="flex-1 min-h-[150px] w-full bg-background border border-border/50 rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={comebackData}>
          <XAxis hide />
          <YAxis hide domain={[0, 25]} />
          <Line type="monotone" dataKey="p1" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
          <Line type="monotone" dataKey="p2" stroke="hsl(var(--muted-foreground))" strokeWidth={3} strokeOpacity={0.3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const StrictModePreview = () => (
  <div className="w-full h-full flex flex-col justify-center p-6 space-y-3">
    <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
      <div className="flex gap-3 items-center">
        <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-xs shrink-0">P1</div>
        <span className="text-sm font-medium">Player 1</span>
      </div>
      <span className="text-xs font-bold text-red-500 tabular-nums bg-red-500/10 px-2 py-1 rounded">-1 Net Fault</span>
    </div>
    <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 ml-4">
      <div className="flex gap-3 items-center">
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">P2</div>
        <span className="text-sm font-medium">Player 2</span>
      </div>
      <span className="text-xs font-bold text-emerald-500 tabular-nums bg-emerald-500/10 px-2 py-1 rounded">+2 Epic Smash</span>
    </div>
    <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
      <div className="flex gap-3 items-center">
        <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-xs shrink-0">P1</div>
        <span className="text-sm font-medium">Player 1</span>
      </div>
      <span className="text-xs font-bold text-red-500 tabular-nums bg-red-500/10 px-2 py-1 rounded">-1 Bad Serve</span>
    </div>
  </div>
);

const AnalyticsPreview = () => (
  <div className="w-full h-full flex items-center justify-center p-6">
    <div className="w-full max-w-[250px] aspect-square">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
          <Radar name="Player" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  </div>
);


const ONBOARDING_STEPS = [
  {
    id: "local-first",
    title: "Lightning Fast. Local First.",
    tag: "Architecture",
    description: "We hate waiting for loading screens between sets. Your matches, groups, and profiles are saved directly to your browser's local storage first.",
    detail: "This guarantees instant page loads and zero interruptions, even if the badminton court has terrible Wi-Fi. It syncs to the server quietly in the background.",
    icon: Database,
    preview: LocalFirstPreview,
  },
  {
    id: "checkpoints",
    title: "Checkpoints & Comebacks",
    tag: "Momentum",
    description: "Don't just record the final 21-19 score. Log mid-game checkpoints (like 11-2) to capture the true story of the match.",
    detail: "The system analyzes your checkpoints to automatically tag 'Epic Comebacks' and 'Downfalls'. Stop losing the context of your greatest games.",
    icon: Activity,
    preview: CheckpointsPreview,
  },
  {
    id: "faults",
    title: "The Fault Tracker",
    tag: "Strict Mode",
    description: "Hold your friends accountable. Use Strict Mode to deduct points for unforced errors or award bonus points for exceptional plays.",
    detail: "Track bad serves, net faults, and epic smashes. Over time, you'll see exactly who gives away the most easy points under pressure.",
    icon: ShieldAlert,
    preview: StrictModePreview,
  },
  {
    id: "analytics",
    title: "Settle The Debate",
    tag: "Intelligence",
    description: "Who actually has the best win rate? Let the automated analytics and leaderboards decide who dominates the group.",
    detail: "Every match feeds into detailed player profiles featuring head-to-head records, form streaks, and performance radars.",
    icon: Trophy,
    preview: AnalyticsPreview,
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem("badminton_onboarded")) {
      router.replace("/");
    }
  }, [router]);

  const step = ONBOARDING_STEPS[currentStep];
  const PreviewComponent = step.preview;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem("badminton_onboarded", "true");
      router.push("/");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row selection:bg-primary/20">
      
      <div className="w-full md:w-[45%] lg:w-[40%] p-8 md:p-12 lg:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border/50 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight">Badminton Tracker</span>
          </div>

          <div className="flex gap-2 w-full pt-8">
            {ONBOARDING_STEPS.map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-500",
                  index <= currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6 pt-4"
            >
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                  {step.tag}
                </span>
                <h1 className="text-3xl md:text-4xl font-medium tracking-tight mt-2 text-foreground/90">
                  {step.title}
                </h1>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {step.description}
              </p>
              <p className="text-sm text-muted-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-4">
                {step.detail}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="pt-12 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={cn("px-4", currentStep === 0 && "opacity-0")}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button 
            size="lg"
            onClick={handleNext} 
            className="rounded-full px-8 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            {isLastStep ? "Enter Dashboard" : "Continue"}
            {isLastStep ? (
              <Check className="w-4 h-4 ml-2" />
            ) : (
              <ChevronRight className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-muted/20 relative overflow-hidden flex items-center justify-center p-8 md:p-12 min-h-[400px]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="relative w-full max-w-lg aspect-square md:aspect-auto md:h-[500px] bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="h-10 border-b border-border/50 bg-muted/30 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            
            <div className="h-[calc(100%-2.5rem)] w-full">
              <PreviewComponent />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
