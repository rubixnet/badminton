"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Home,
  BarChart2,
  Users,
  Settings as SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription
} from "@/components/ui/card";
import { useMobile } from "@/hooks/use-mobile";

interface NavbarProps {
  title?: string;
  onCreateMatch?: () => void;
}

interface PlayerDropdownProps {
  players: string[];
  onSelectPlayer: (player: string) => void;
}

function PlayerDropdown({ players, onSelectPlayer }: PlayerDropdownProps) {
  return (
    <Card className="rounded-2xl border border-border/50 shadow-xl bg-background overflow-hidden">
      <CardHeader className="pb-4 bg-muted/10 border-b border-border/40">
        <CardDescription>Click to view deep analytics for individual players</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 max-h-[50vh] overflow-y-auto">
        {players.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {players.map((player) => (
              <Button
                key={player}
                variant="outline"
                className="rounded-xl min-h-10 px-5 hover:border-primary transition-colors shadow-none border-border/60 bg-background active:scale-[0.96]"
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

export function Navbar({ title, onCreateMatch }: NavbarProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupid as string;

  const isMobile = useMobile();

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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
    if (!groupId) return;

    const extractPlayers = async () => {
      const cacheKey = `badminton_analytics_matches_${groupId}`;
      const stored = localStorage.getItem(cacheKey);

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.matches) {
            const players = new Set<string>();
            parsed.matches.forEach((m: any) => {
              m.team1.players.forEach((p: any) => p.name && players.add(p.name.trim()));
              m.team2.players.forEach((p: any) => p.name && players.add(p.name.trim()));
            });
            setAllPlayers(Array.from(players).sort());
            return;
          }
        } catch (e) { console.error(e); }
      }

      try {
        const res = await fetch(`/api/analytics?groupId=${groupId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.matches) {
            const players = new Set<string>();
            data.matches.forEach((m: any) => {
              m.team1.players.forEach((p: any) => p.name && players.add(p.name.trim()));
              m.team2.players.forEach((p: any) => p.name && players.add(p.name.trim()));
            });
            setAllPlayers(Array.from(players).sort());
          }
        }
      } catch (e) { console.error(e); }
    };
    extractPlayers();
  }, [groupId]);

  const goToPlayer = (player: string) => {
    setIsPopoverOpen(false);
    router.push(`/home/${groupId}/analytics/player/${encodeURIComponent(player)}`);
  };

  if (!groupId) return null;

  return (
    <>
      <div className="h-[76px] w-full" />

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md transition-transform duration-300 ease-in-out",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="md:container md:max-w-6xl md:mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-[76px]">

            <div className="flex items-center cursor-pointer shrink-0 gap-3">
              {title ? (
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
              ) : (
                <Link href={`/home/${groupId}`} className="text-xl select-none font-bold tracking-tight hover:opacity-80 transition-opacity md:hidden">
                  Badminton <span className="text-primary">Tracker</span>
                </Link>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 lg:gap-6 h-full overflow-x-auto no-scrollbar">
              <nav className="flex items-center gap-1 md:gap-2 lg:gap-4 h-full">

                <Link
                  href={`/home/${groupId}`}
                  className={cn(
                    "flex items-center gap-2 h-full text-sm font-medium transition-all px-3 border-b-2",
                    pathname === `/home/${groupId}` ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Home className="h-4 w-4 hidden lg:block" />
                  Home
                </Link>

                <Link
                  href={`/home/${groupId}/analytics`}
                  className={cn(
                    "flex items-center gap-2 h-full text-sm font-medium transition-all px-3 border-b-2",
                    pathname === `/home/${groupId}/analytics` ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <BarChart2 className="h-4 w-4 hidden lg:block" />
                  Analytics
                </Link>

                {!isMobile && (
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger >
                      <button
                        className={cn(
                          "flex items-center gap-2 h-full text-sm font-medium transition-all px-3 border-b-2 outline-none",
                          pathname.includes("/player/") ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground "
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

                <Link
                  href={`/home/${groupId}/settings`}
                  className={cn(
                    "flex items-center gap-2 h-full text-sm font-medium transition-all px-3 border-b-2",
                    pathname.includes(`/home/${groupId}/settings`) ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <SettingsIcon className="h-4 w-4 hidden lg:block" />
                  Settings
                </Link>
              </nav>

              {onCreateMatch && (
                <div className="flex items-center pl-1">
                  <Button
                    onClick={onCreateMatch}
                  >
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
            <Link href={`/home/${groupId}`} className="flex flex-col items-center p-2">
              <Home className={cn("h-6 w-6", pathname === `/home/${groupId}` ? "text-primary" : "text-muted-foreground")} />
            </Link>

            <Link href={`/home/${groupId}/analytics`} className="flex flex-col items-center p-2">
              <BarChart2 className={cn("h-6 w-6", pathname === `/home/${groupId}/analytics` ? "text-primary" : "text-muted-foreground")} />
            </Link>

            {onCreateMatch && (
              <button
                onClick={onCreateMatch}
                className="relative -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-90"
              >
                <Plus className="h-7 w-7" />
              </button>
            )}
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger >
                <button className="flex flex-col items-center p-2 outline-none">
                  <Users className={cn("h-6 w-6", pathname.includes("/player/") ? "text-primary" : "text-muted-foreground")} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="center" side="top" sideOffset={24} className="w-[92vw] p-0 rounded-2xl shadow-2xl border-none bg-transparent">
                <PlayerDropdown players={allPlayers} onSelectPlayer={goToPlayer} />
              </PopoverContent>
            </Popover>

            <Link href={`/home/${groupId}/settings`} className="flex flex-col items-center p-2">
              <SettingsIcon className={cn("h-6 w-6", pathname.includes(`/home/${groupId}/settings`) ? "text-primary" : "text-muted-foreground")} />
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
