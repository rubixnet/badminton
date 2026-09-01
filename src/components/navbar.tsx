"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  Plus,
  Home,
  BarChart2,
  Users,
  Settings as SettingsIcon,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MatchParticipant {
  name: string;
}

interface MatchTeam {
  players: MatchParticipant[];
}

interface MatchRecord {
  team1: MatchTeam;
  team2: MatchTeam;
}

interface NavbarProps {
  title?: string;
  onCreateMatch?: () => void;
  isAuthenticated?: boolean;
}

interface NavItemConfig {
  key: string;
  label: string;
  href: (groupId: string) => string;
  icon: LucideIcon;
  tourId: string;
  requiresAuth?: boolean;
  isActive: (pathname: string, groupId: string) => boolean;
}

interface TourStep {
  targetId: string;
  title: string;
  description: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    key: "home",
    label: "Home",
    href: (gid) => `/home/${gid}`,
    icon: Home,
    tourId: "tour-home",
    isActive: (pathname, gid) => pathname === `/home/${gid}`,
  },
  {
    key: "analytics",
    label: "Analytics",
    href: (gid) => `/home/${gid}/analytics`,
    icon: BarChart2,
    tourId: "tour-analytics",
    isActive: (pathname, gid) => pathname === `/home/${gid}/analytics`,
  },
  {
    key: "settings",
    label: "Settings",
    href: (gid) => `/home/${gid}/settings`,
    icon: SettingsIcon,
    tourId: "tour-settings",
    requiresAuth: true,
    isActive: (pathname, gid) => pathname.includes(`/home/${gid}/settings`),
  },
];

function extractUniquePlayers(matches: MatchRecord[]): string[] {
  const names = new Set<string>();
  for (const match of matches) {
    match.team1?.players?.forEach((p) => p.name?.trim() && names.add(p.name.trim()));
    match.team2?.players?.forEach((p) => p.name?.trim() && names.add(p.name.trim()));
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

interface PlayerDropdownProps {
  players: string[];
  onSelectPlayer: (player: string) => void;
}

function PlayerDropdown({ players, onSelectPlayer }: PlayerDropdownProps) {
  return (
    <Card className="rounded-2xl border border-border/50 shadow-xl bg-background overflow-hidden">
      <CardHeader className="pb-3 bg-muted/10 border-b border-border/40">
        <CardDescription>Select a player to view deep analytics</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 max-h-[50vh] overflow-y-auto">
        {players.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {players.map((player) => (
              <Button
                key={player}
                variant="outline"
                size="sm"
                className="rounded-xl h-9 px-4 hover:border-primary transition-colors border-border/60 bg-background active:scale-95"
                onClick={() => onSelectPlayer(player)}
              >
                {player}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No players recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function TourOverlay({
  steps,
  currentStep,
  onNext,
  onPrev,
  onDone,
  isMobile,
}: {
  steps: TourStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onDone: () => void;
  isMobile: boolean;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; side: "bottom" | "top" | "left" | "right" }>({ top: 0, left: 0, side: "bottom" });

  const step = steps[currentStep];

  useEffect(() => {
    if (!step) return;
    const el = document.getElementById(step.targetId);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    const updatePosition = () => {
      const rect = el.getBoundingClientRect();
      const tooltipEl = tooltipRef.current;
      const tooltipRect = tooltipEl?.getBoundingClientRect();

      if (!tooltipRect) return;

      let side: "bottom" | "top" | "left" | "right" = isMobile ? "bottom" : "bottom";
      let top = 0;
      let left = 0;

      if (isMobile) {
        top = rect.top - tooltipRect.height - 12;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        if (top < 8) {
          side = "top";
          top = rect.bottom + 12;
        }
      } else {
        top = rect.bottom + 12;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        if (top + tooltipRect.height > window.innerHeight - 8) {
          side = "top";
          top = rect.top - tooltipRect.height - 12;
        }
      }

      left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

      setPos({ top, left, side });
    };

    const timer = setTimeout(updatePosition, 50);
    window.addEventListener("resize", updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
    };
  }, [step, isMobile, currentStep]);

  if (!step) return null;

  const el = document.getElementById(step.targetId);

  return (
    <div className="fixed inset-0 z-[9998]" onClick={onDone}>
      <div className="absolute inset-0 bg-black/40" />

      {el && (
        <div
          className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background transition-all duration-300"
          style={{
            top: el.getBoundingClientRect().top - 4,
            left: el.getBoundingClientRect().left - 4,
            width: el.getBoundingClientRect().width + 8,
            height: el.getBoundingClientRect().height + 8,
          }}
        />
      )}

      <div
        ref={tooltipRef}
        onClick={(e) => e.stopPropagation()}
        className="absolute z-[9999] w-72 bg-background border border-border/50 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">
            Step {currentStep + 1} of {steps.length}
          </span>
          <button onClick={onDone} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Skip tour">
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-1">{step.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{step.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === currentStep ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={onPrev} className="h-8 px-3 text-xs">
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button size="sm" onClick={onNext} className="h-8 px-3 text-xs">
                Next
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={onDone} className="h-8 px-3 text-xs">
                Got it ✨
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Navbar({ title, onCreateMatch, isAuthenticated }: NavbarProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const isMobile = useMobile();

  const groupId = (params?.groupid as string) || "";

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [sessionAvailable, setSessionAvailable] = useState(false);
  const [showTourBtn, setShowTourBtn] = useState(() => {
    if (typeof window !== "undefined" && groupId) {
      return localStorage.getItem(`hide_tour_${groupId}`) !== "true";
    }
    return false;
  });
  const [isHelpPopoverOpen, setIsHelpPopoverOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const isLoggedIn = isAuthenticated ?? sessionAvailable;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (isAuthenticated !== undefined) return;
    let isMounted = true;

    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (isMounted) setSessionAvailable(response.ok);
      } catch {
        if (isMounted) setSessionAvailable(false);
      }
    };

    checkSession();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!groupId) return;

    const fetchPlayers = async () => {
      const cacheKey = `badminton_analytics_matches_${groupId}`;
      const stored = localStorage.getItem(cacheKey);

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.matches)) {
            setAllPlayers(extractUniquePlayers(parsed.matches));
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      try {
        const res = await fetch(`/api/analytics?groupId=${groupId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.matches)) {
            setAllPlayers(extractUniquePlayers(data.matches));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchPlayers();
  }, [groupId]);

  const goToPlayer = useCallback(
    (player: string) => {
      setIsPopoverOpen(false);
      router.push(`/home/${groupId}/analytics/player/${encodeURIComponent(player)}`);
    },
    [groupId, router]
  );

  const handleHideTour = () => {
    setIsHelpPopoverOpen(false);
    setShowTourBtn(false);
    localStorage.setItem(`hide_tour_${groupId}`, "true");
  };

  const tourSteps: TourStep[] = useMemo(() => {
    const prefix = isMobile ? "mobile" : "desktop";
    const steps: TourStep[] = [
      {
        targetId: `tour-home-${prefix}`,
        title: "Dashboard Hub",
        description: "Your main dashboard for tracking recent activity and group updates.",
      },
      {
        targetId: `tour-analytics-${prefix}`,
        title: "Deep Analytics",
        description: "Visualize win rates, match history, and performance charts for the whole group.",
      },
      {
        targetId: `tour-profiles-${prefix}`,
        title: "Player Profiles",
        description: "Access detailed individual statistics and specific player histories.",
      },
    ];

    if (isLoggedIn) {
      steps.push({
        targetId: `tour-settings-${prefix}`,
        title: "Group Settings",
        description: "Manage group preferences, metadata, and member configurations.",
      });
    }

    if (isLoggedIn && onCreateMatch) {
      steps.push({
        targetId: `tour-create-${prefix}`,
        title: "Record Matches",
        description: "Quickly log new matches and update group standings here.",
      });
    }

    return steps;
  }, [isMobile, isLoggedIn, onCreateMatch]);

  const handleStartTour = () => {
    setIsHelpPopoverOpen(false);
    setIsVisible(true);
    setTourStep(0);
    setTourActive(true);
  };

  const handleTourNext = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep((s) => s + 1);
    } else {
      setTourActive(false);
    }
  };

  const handleTourPrev = () => {
    if (tourStep > 0) setTourStep((s) => s - 1);
  };

  const handleTourDone = () => {
    setTourActive(false);
  };

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.requiresAuth || isLoggedIn),
    [isLoggedIn]
  );

  const isPlayerProfileActive = pathname.includes("/player/");

  if (!groupId) return null;

  return (
    <>
      <div className="h-[76px] w-full" aria-hidden="true" />

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md transition-transform duration-300 ease-in-out",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="md:container md:max-w-6xl md:mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-[76px]">
            <div className="flex items-center shrink-0 gap-3">
              {title ? (
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
                  {title}
                </h1>
              ) : (
                <Link
                  href={`/home/${groupId}`}
                  className="text-xl font-bold tracking-tight select-none hover:opacity-80 transition-opacity md:hidden"
                >
                  Badminton <span className="text-primary">Tracker</span>
                </Link>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 lg:gap-6 h-full overflow-x-auto no-scrollbar">
              <nav className="flex items-center gap-1 md:gap-2 lg:gap-4 h-full">
                {showTourBtn && (
                  <Popover open={isHelpPopoverOpen} onOpenChange={setIsHelpPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary shrink-0"
                        title="Need Help?"
                      >
                        <HelpCircle className="h-[22px] w-[22px]" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" sideOffset={12} className="w-56 p-2 rounded-xl shadow-lg border-border">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                          Quick Onboarding
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start w-full font-medium"
                          onClick={handleStartTour}
                        >
                          Start Interface Tour
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={handleHideTour}
                        >
                          Hide this button forever
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.isActive(pathname, groupId);

                  return (
                    <Link
                      key={item.key}
                      id={`${item.tourId}-desktop`}
                      href={item.href(groupId)}
                      className={cn(
                        "flex items-center gap-2 h-full text-sm font-medium transition-colors px-3 border-b-2",
                        active
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <Icon className="h-4 w-4 hidden lg:block" />
                      {item.label}
                    </Link>
                  );
                })}

                {!isMobile && (
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        id="tour-profiles-desktop"
                        type="button"
                        className={cn(
                          "flex items-center gap-2 h-full text-sm font-medium transition-colors px-3 border-b-2 outline-none",
                          isPlayerProfileActive
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Users className="h-4 w-4 hidden lg:block" />
                        Profiles
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-[450px] p-0 rounded-2xl shadow-2xl border-none bg-transparent">
                      <PlayerDropdown players={allPlayers} onSelectPlayer={goToPlayer} />
                    </PopoverContent>
                  </Popover>
                )}
              </nav>

              {isLoggedIn && onCreateMatch && (
                <div className="flex items-center pl-1">
                  <Button id="tour-create-desktop" onClick={onCreateMatch}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    <span className="font-semibold">Create Match</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {isMobile && (
        <nav
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ease-in-out sm:hidden",
            isVisible ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="flex h-16 items-center justify-around px-2">
            <Link id="tour-home-mobile" href={`/home/${groupId}`} className="flex flex-col items-center p-2">
              <Home
                className={cn(
                  "h-6 w-6",
                  pathname === `/home/${groupId}` ? "text-primary" : "text-muted-foreground"
                )}
              />
            </Link>

            <Link id="tour-analytics-mobile" href={`/home/${groupId}/analytics`} className="flex flex-col items-center p-2">
              <BarChart2
                className={cn(
                  "h-6 w-6",
                  pathname === `/home/${groupId}/analytics` ? "text-primary" : "text-muted-foreground"
                )}
              />
            </Link>

            {isLoggedIn && onCreateMatch && (
              <button
                id="tour-create-mobile"
                type="button"
                onClick={onCreateMatch}
                className="relative -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-90"
              >
                <Plus className="h-7 w-7" />
              </button>
            )}

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button id="tour-profiles-mobile" type="button" className="flex flex-col items-center p-2 outline-none">
                  <Users
                    className={cn(
                      "h-6 w-6",
                      isPlayerProfileActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                side="top"
                sideOffset={24}
                className="w-[92vw] p-0 rounded-2xl shadow-2xl border-none bg-transparent"
              >
                <PlayerDropdown players={allPlayers} onSelectPlayer={goToPlayer} />
              </PopoverContent>
            </Popover>

            {isLoggedIn && (
              <Link id="tour-settings-mobile" href={`/home/${groupId}/settings`} className="flex flex-col items-center p-2">
                <SettingsIcon
                  className={cn(
                    "h-6 w-6",
                    pathname.includes(`/home/${groupId}/settings`) ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </Link>
            )}
          </div>
        </nav>
      )}

      {tourActive && (
        <TourOverlay
          steps={tourSteps}
          currentStep={tourStep}
          onNext={handleTourNext}
          onPrev={handleTourPrev}
          onDone={handleTourDone}
          isMobile={isMobile}
        />
      )}
    </>
  );
}
