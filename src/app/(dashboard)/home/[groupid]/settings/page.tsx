"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { MatchForm } from "@/components/match-form";
import {
  Copy,
  Check,
  Users,
  Shield,
  Link as LinkIcon,
  Edit3,
  Trash2,
  LogOut,
  ChevronDown,
  UserMinus,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Lock,
  Monitor,
  Moon,
  Sun
} from "lucide-react";
import type { Match } from "@/types/match";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type ClubPosition = "Leader" | "Editor" | "Member";

const POSITION_ORDER: Record<ClubPosition, number> = {
  "Leader": 1,
  "Editor": 2,
  "Member": 3,
};

type MemberRow = {
  _id: string;
  name: string;
  clubRole?: string;
};

type ThemeValue = "light" | "dark" | "system";

const THEME_OPTIONS: Array<{ value: ThemeValue; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
];

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupid as string;
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // `next-themes` only knows the real value on the client, so the segmented
  // control stays neutral until after hydration to avoid a mismatch.
  useEffect(() => setMounted(true), []);

  const [copied, setCopied] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [isMatchesLoading, setIsMatchesLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [visibleMatchesCount, setVisibleMatchesCount] = useState(6);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const [isSavingPublicScores, setIsSavingPublicScores] = useState(false);
  const [publicScoresError, setPublicScoresError] = useState<string | null>(null);

  const [userSession, setUserSession] = useState<{ userId: string; name?: string; email?: string } | null>(null);
  const profile = useQuery(api.users.getProfile, userSession?.userId ? { workosId: userSession.userId } : "skip");
  const group = useQuery(api.group.getGroupById, groupId ? { groupId: groupId as any } : "skip");
  const signedMembers = useQuery(api.users.getUsersByGroupId, groupId ? { groupId } : "skip");
  const updateMemberName = useMutation(api.users.updateMemberName);
  const updateMemberRole = useMutation(api.users.updateMemberRole);
  const removeMember = useMutation(api.users.removeMember);
  const updatePublicScores = useMutation(api.group.updatePublicScores);
  // Bumps `groups.lastActivity` so every open device pulls fresh match rows
  // instead of waiting for a manual reload.
  const signalRefresh = useMutation(api.group.triggerRefresh);

  const [managingMember, setManagingMember] = useState<MemberRow | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<MemberRow | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<ClubPosition>("Member");
  const [editingNameInModal, setEditingNameInModal] = useState("");
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!groupId) return;
    const ctrl = new AbortController();

    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          setUserSession(data);
          setIsAuthenticated(true);
        } else if (!ctrl.signal.aborted) {
          router.push("/login");
        }
      } catch (e) {
        if (!ctrl.signal.aborted) console.error("Session check failed:", e);
      }
    };

    const loadMatches = async () => {
      setIsMatchesLoading(true);
      setMatchesError(null);
      try {
        const res = await fetch(`/api/matches?groupId=${encodeURIComponent(groupId)}&page=1&limit=1000`, {
          signal: ctrl.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.matches) setMatches(data.matches);
        } else {
          const body = await res.json().catch(() => null);
          if (!ctrl.signal.aborted) setMatchesError(body?.error || "Could not load matches.");
        }
      } catch (e) {
        if (!ctrl.signal.aborted) {
          console.error("Failed to fetch matches:", e);
          setMatchesError("Could not load matches.");
        }
      } finally {
        if (!ctrl.signal.aborted) setIsMatchesLoading(false);
      }
    };

    loadSession();
    loadMatches();
    return () => ctrl.abort();
  }, [groupId, router]);

  // SINGLE SERVER SOURCE OF TRUTH FOR ROLES
  const getMemberPosition = useCallback((member: MemberRow | null | undefined): ClubPosition => {
    if (!member?._id) return "Member";
    if (group?.adminId && member._id.toString() === group.adminId.toString()) return "Leader";
    if ((member as any).clubRole === "Editor") return "Editor";
    return "Member";
  }, [group?.adminId]);

  const activeMembers: MemberRow[] = useMemo(() => {
    if (!signedMembers) return [];
    return signedMembers as unknown as MemberRow[];
  }, [signedMembers]);

  const currentUserPosition: ClubPosition = useMemo(() => {
    if (!profile?._id) return "Member";
    return getMemberPosition(profile as unknown as MemberRow);
  }, [profile, getMemberPosition]);

  // RELIABLE LEADER CHECK
  const isLeader = Boolean(profile?._id && group?.adminId && profile._id.toString() === group.adminId.toString());

  const canEditScores = isAuthenticated && (isLeader || currentUserPosition === "Editor");

  const sortedMembers = useMemo(() => {
    return [...activeMembers].sort((a: any, b: any) => {
      const posA = getMemberPosition(a);
      const posB = getMemberPosition(b);
      if (POSITION_ORDER[posA] !== POSITION_ORDER[posB]) {
        return POSITION_ORDER[posA] - POSITION_ORDER[posB];
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [activeMembers, getMemberPosition]);

  const handleOpenMemberDialog = (member: MemberRow) => {
    if (!isLeader) return;
    setManagingMember(member);
    setEditingNameInModal(member.name || "");
    setSelectedPosition(getMemberPosition(member));
  };

  // The Leader is derived from `groups.adminId`, so their club role is not editable.
  const managingIsLeader =
    !!managingMember && getMemberPosition(managingMember) === "Leader";

  const handleSaveMemberDetails = async () => {
    if (!isLeader || !managingMember || !userSession?.userId) return;
    const trimmedName = editingNameInModal.trim();
    if (!trimmedName) {
      toast({ title: "Error", description: "Player name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSavingMember(true);
    try {
      if (trimmedName !== managingMember.name) {
        await updateMemberName({
          adminWorkosId: userSession.userId,
          memberId: managingMember._id as any,
          name: trimmedName,
        });
      }

      const currentPos = getMemberPosition(managingMember);
      if (currentPos !== "Leader" && selectedPosition !== currentPos) {
        await updateMemberRole({
          adminWorkosId: userSession.userId,
          memberId: managingMember._id as any,
          clubRole: selectedPosition,
        });
      }

      toast({
        title: currentPos === "Leader" ? "Name Updated" : "Role Updated",
        description:
          currentPos === "Leader"
            ? `${trimmedName}'s display name was updated.`
            : `${trimmedName} is now ${selectedPosition}.`,
      });
      setManagingMember(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update member.",
        variant: "destructive",
      });
    } finally {
      setIsSavingMember(false);
    }
  };

  const initiateRemoveMember = (member: MemberRow) => {
    if (!isLeader) return;
    if (group?.adminId && member._id?.toString() === group.adminId.toString()) {
      toast({
        title: "Action Prohibited",
        description: "The club founder cannot be removed from the club.",
        variant: "destructive",
      });
      return;
    }
    setMemberToRemove(member);
  };

  const confirmAndExecuteRemoval = async () => {
    if (!isLeader || !memberToRemove || !userSession?.userId) return;
    setIsRemovingMember(true);
    try {
      await removeMember({
        adminWorkosId: userSession.userId,
        memberId: memberToRemove._id as any,
      });
      toast({
        title: "Member Removed",
        description: `${memberToRemove.name} was removed from the roster. Match records are preserved.`,
      });
      setMemberToRemove(null);
      setManagingMember(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove member.",
        variant: "destructive",
      });
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleCopy = async () => {
    if (!group?.inviteCode) return;
    const inviteLink = `${origin}/invite/${group.inviteCode}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        // Fallback for non-secure contexts
        const ta = document.createElement("textarea");
        ta.value = inviteLink;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Long-press the link to copy it manually.", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.clear();
    } catch (_e) {
      void _e;
    }
    window.location.href = "/api/auth/logout";
  };

  // Shared broadcast after any match mutation here. Fire-and-forget so a
  // Convex hiccup never masks the sheet write that already succeeded.
  const broadcastMatchChange = () => {
    if (!group?._id) return;
    void signalRefresh({ groupId: group._id }).catch(() => undefined);
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!isLeader) return;
    if (!confirm("Are you sure you want to delete this match record?")) return;
    try {
      const res = await fetch(`/api/matches?id=${encodeURIComponent(matchId)}`, { method: "DELETE" });
      if (res.ok) {
        setMatches((prev) => prev.filter((m) => m.id !== matchId));
        toast({ title: "Success", description: "Match deleted successfully." });
        broadcastMatchChange();
      } else {
        throw new Error("Failed to delete");
      }
    } catch {
      toast({ title: "Error", description: "Could not delete match.", variant: "destructive" });
    }
  };

  const handleUpdateMatch = async (updatedData: any) => {
    if (!canEditScores || !editingMatch) return;
    try {
      const res = await fetch("/api/matches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedData,
          id: editingMatch.id,
          // The PUT route rewrites the whole row, so carry the group and author
          // columns through — dropping them here would blank them in the sheet.
          groupId: groupId,
          userId: editingMatch.userId,
          userName: editingMatch.userName,
        }),
      });
      if (res.ok) {
        setMatches((prev) => prev.map((m) => (m.id === editingMatch.id ? { ...m, ...updatedData } : m)));
        setEditingMatch(null);
        toast({ title: "Success", description: "Match updated successfully." });
        broadcastMatchChange();
      } else {
        throw new Error("Failed to update");
      }
    } catch {
      toast({ title: "Error", description: "Could not update match.", variant: "destructive" });
    }
  };

  const inviteLink = group?.inviteCode && origin ? `${origin}/invite/${group.inviteCode}` : "";
  const publicScoresEnabled = Boolean(group?.isPublic);

  const handlePublicScoresChange = async (checked: boolean) => {
    if (!isLeader || !userSession?.userId || !group?._id) return;
    setIsSavingPublicScores(true);
    setPublicScoresError(null);
    try {
      await updatePublicScores({
        groupId: group._id,
        adminWorkosId: userSession.userId,
        isPublic: checked,
      });
    } catch (error) {
      setPublicScoresError(
        error instanceof Error ? error.message : "Failed to update public scores.",
      );
    } finally {
      setIsSavingPublicScores(false);
    }
  };

  const renderPositionBadge = (pos: ClubPosition) => {
    switch (pos) {
      case "Leader":
        return (
          <Badge variant="default" className="gap-1 text-[11px] font-semibold px-2 py-0.5 shadow-none">
            Leader
          </Badge>
        );
      case "Editor":
        return (
          <Badge variant="secondary" className="gap-1 text-[11px] font-semibold px-2 py-0.5 shadow-none">
            Editor
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground text-[11px] font-medium px-2 py-0.5 shadow-none">
            Member
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar title="Settings" />
      <main className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6 md:py-10 space-y-8 md:space-y-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">Club Settings</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Managing <span className="font-medium text-foreground/80">{group?.name || "..."}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border/50 bg-card shadow-sm p-5 sm:p-6 flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Members</span>
                <Users className="h-4 w-4 opacity-40 shrink-0" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
                  {signedMembers === undefined ? "-" : activeMembers.length}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1 ">Verified members</p>
              </div>
            </Card>

            <Card className="rounded-2xl border-border/50 bg-card shadow-sm p-5 sm:p-6 flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Your Rank</span>
                <Shield className="h-4 w-4 opacity-40 shrink-0" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight">{profile === undefined ? "-" : currentUserPosition}</div>
                  {isLeader && <div className="w-2 h-2 rounded-full bg-foreground/10 animate-pulse" />}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1 ">
                  {isLeader ? "Full administrative control" : canEditScores ? "Officer permissions" : "Member access"}
                </p>
              </div>
            </Card>
          </div>

          <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-balance">Invite Link</CardTitle>
              <CardDescription>Anyone with this link can join your club and see match history.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-60 shrink-0" />
                  <Input
                    readOnly
                    value={inviteLink}
                    placeholder={group === undefined ? "Loading…" : "No invite code"}
                    className="pl-9 h-10 py-1 bg-background border-border/50 rounded-xl text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-foreground"
                  />
                </div>
                <Button
                  onClick={handleCopy}
                  disabled={!inviteLink}
                  variant={copied ? "outline" : "default"}
                  className={cn(
                    "rounded-xl h-10 px-5 text-sm sm:text-base font-semibold touch-manipulation active:scale-[0.99] transition-transform w-full sm:w-auto shrink-0 shadow-sm",
                  )}
                >
                  {copied ? <Check className="h-4 w-4 mr-2 shrink-0" /> : <Copy className="h-4 w-4 mr-2 shrink-0" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-base text-balance">Public Scores</CardTitle>
                <CardDescription>
                  Allow anyone with the club link to view scores and analytics without signing in.
                </CardDescription>
              </div>
              <Switch
                checked={publicScoresEnabled}
                disabled={!isLeader || isSavingPublicScores || !group}
                onCheckedChange={handlePublicScoresChange}
                aria-label="Make scores public"
              />
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                {isLeader
                  ? publicScoresEnabled
                    ? "Scores are public. New matches still require a signed-in member."
                    : "Scores are private by default."
                  : "Only the club leader can change this setting."}
              </p>
              {publicScoresError && (
                <p className="mt-3 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
                  {publicScoresError}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-balance">Appearance</CardTitle>
              <CardDescription>
                Choose how Badminton Tracker looks on this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = mounted && theme === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      aria-pressed={isActive}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border touch-manipulation active:scale-[0.99] transition-all select-none",
                        isActive
                          ? "border-foreground bg-muted/50 shadow-sm"
                          : "border-border/60 hover:bg-muted/30"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-foreground/90" />
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          isActive ? "text-foreground" : "text-foreground/80"
                        )}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!mounted && (
                <p className="text-xs text-muted-foreground">Loading your theme preference…</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div className="space-y-1.5">
                <CardTitle className="text-base text-balance">Verified Members</CardTitle>
                <CardDescription>
                  {isLeader ? "Tap on any member to reassign their position or remove them." : "Players currently authenticated in the roster."}
                </CardDescription>
              </div>
              <Badge variant="outline" className="rounded-lg border-border/50 font-medium tabular-nums text-xs shadow-none">
                {signedMembers === undefined ? "-" : activeMembers.length} Total
              </Badge>
            </CardHeader>
            <CardContent>
              {signedMembers === undefined ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 border border-border/50 rounded-xl bg-muted/10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                  <p className="font-semibold text-xs sm:text-[13px] text-muted-foreground">Loading verified members...</p>
                </div>
              ) : activeMembers.length === 0 ? (
                <div className="py-10 text-center text-sm font-semibold text-muted-foreground">
                   No active members found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedMembers.map((member: any) => {
                    const pos = getMemberPosition(member);
                    const isCurrentUser = member._id?.toString() === profile?._id?.toString();

                    return (
                      <div
                        key={member._id}
                        onClick={() => isLeader ? handleOpenMemberDialog(member) : undefined}
                        className={cn(
                          "flex items-center justify-between p-4 border border-border/50 rounded-xl bg-background transition-all select-none",
                          isLeader && "hover:bg-muted/30 cursor-pointer group"
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted border border-border text-foreground text-xs flex items-center justify-center font-bold shrink-0">
                            {(member.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className=" text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors block">
                              {member.name} {isCurrentUser && <span className="text-xs text-muted-foreground font-normal">(You)</span>}
                            </span>
                            <div className="mt-0.5">
                              {renderPositionBadge(pos)}
                            </div>
                          </div>
                        </div>
                        {isLeader && (
                          <div className="ml-3 flex shrink-0 items-center">
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {canEditScores && (
            <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base text-balance">Match Management</CardTitle>
                  </div>
                  <CardDescription>
                    {isLeader ? "Edit or remove recent matches." : "Edit scores and details of recent matches."}
                  </CardDescription>
                </div>
                {matches.length > 0 && (
                  <Badge variant="outline" className="rounded-lg border-border/50 font-medium tabular-nums text-xs shadow-none w-fit">
                    Showing {Math.min(visibleMatchesCount, matches.length)} of {matches.length}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex flex-col border border-border/50 rounded-xl bg-background overflow-hidden">
                  {isMatchesLoading ? (
                    <div className="p-10 flex flex-col items-center justify-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                      <p className="font-semibold text-xs sm:text-[13px] text-muted-foreground">Loading matches...</p>
                    </div>
                  ) : matchesError ? (
                    <div className="p-10 text-center space-y-3">
                      <p className="font-semibold text-xs sm:text-[13px] text-foreground/80">{matchesError}</p>
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="p-10 text-center space-y-2">
                      <p className="font-semibold text-xs sm:text-[13px] text-foreground/80">No matches recorded yet</p>
                    </div>
                  ) : (
                    <>
                      {matches.slice(0, visibleMatchesCount).map((match) => (
                        <div key={match.id} className="flex flex-col p-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest tabular-nums">
                              {new Date(match.createdAt).toLocaleDateString()}
                              <div className="px-2.5 py-0.5 mt-3 rounded-md bg-muted font-mono font-bold text-sm tabular-nums border border-border/50 text-center whitespace-nowrap">
                                <span className={match.team1.score > match.team2.score ? "text-foreground font-bold" : "text-foreground"}>
                                  {match.team1.score}
                                </span>
                                <span className="text-muted-foreground mx-1.5">:</span>
                                <span className={match.team2.score > match.team1.score ? "text-foreground font-bold" : "text-foreground"}>
                                  {match.team2.score}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 sm:h-7 sm:w-7 p-0 rounded-md text-muted-foreground border border-border/70 bg-muted/40 sm:border-0 sm:bg-transparent hover:text-foreground transition-colors"
                                onClick={() => setEditingMatch(match)}
                              >
                                <Edit3 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                                <span className="sr-only">Edit match</span>
                              </Button>
                              {isLeader && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 w-9 sm:h-7 sm:w-7 p-0 rounded-md text-muted-foreground border border-border/70 bg-muted/40 sm:border-0 sm:bg-transparent hover:text-[var(--destructive)] transition-colors"
                                  onClick={() => handleDeleteMatch(match.id)}
                                >
                                  <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                                  <span className="sr-only">Delete match</span>
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 font-semibold text-xs sm:text-[13px]">
                            <div className={cn("sm:text-left", match.team1.score > match.team2.score ? "text-foreground font-bold" : "text-muted-foreground")}>
                              {match.team1.players.map(p => p.name).join(" & ")}
                            </div>
                            <div className={cn("sm:text-right", match.team2.score > match.team1.score ? "text-foreground font-bold" : "text-muted-foreground")}>
                              {match.team2.players.map(p => p.name).join(" & ")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {matches.length > 6 && (
                  <div className="flex items-center justify-between pt-4 gap-2">
                    {visibleMatchesCount < matches.length ? (
                      <Button
                        variant="outline"
                        className="w-full rounded-xl h-10 text-sm sm:text-base font-semibold touch-manipulation active:scale-[0.99] transition-transform"
                        onClick={() => setVisibleMatchesCount((prev) => Math.min(prev + 10, matches.length))}
                      >
                        <ChevronDown className="h-4 w-4 mr-1.5" />
                        Show More Matches ({matches.length - visibleMatchesCount} remaining)
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full rounded-xl h-10 text-sm sm:text-base font-semibold text-muted-foreground touch-manipulation active:scale-[0.99] transition-transform"
                        onClick={() => setVisibleMatchesCount(6)}
                      >
                        Show Less
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-border/50 bg-card shadow-sm mt-4">
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left space-y-1">
                <h3 className="font-bold text-base sm:text-lg uppercase tracking-wide text-foreground">Sign Out</h3>
                <p className="font-semibold text-xs sm:text-[13px] text-muted-foreground">
                  Logged in as <span className="text-foreground/80 font-bold">{userSession?.email}</span>
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full sm:w-auto border-[var(--destructive)] text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)] rounded-xl h-10 px-6 text-sm sm:text-base font-semibold touch-manipulation active:scale-[0.99] transition-transform shadow-none shrink-0"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2 shrink-0" /> Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={!!managingMember} onOpenChange={(open) => !open && !isSavingMember && setManagingMember(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border border-border/50 shadow-2xl bg-card">
          {managingMember && (
            <>
              <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-muted border border-border text-foreground text-base font-black flex items-center justify-center shrink-0">
                    {(managingMember.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="font-bold text-base sm:text-lg uppercase tracking-wide text-foreground">
                      {managingMember.name}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {renderPositionBadge(getMemberPosition(managingMember))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Player Name
                  </Label>
                  <Input
                    value={editingNameInModal}
                    onChange={(e) => setEditingNameInModal(e.target.value)}
                    className="h-10 rounded-lg bg-background pt-1 text-base sm:text-sm font-medium focus-visible:ring-1 focus-visible:ring-foreground"
                    placeholder="Player display name"
                    maxLength={40}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Assigned Club Role
                    </Label>
                  </div>

                  {managingIsLeader ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <p className="font-semibold text-xs sm:text-[13px] text-foreground/90">Leader</p>
                        </div>
                      </div>
                      <div className="p-3 bg-muted/40 border border-border/60 rounded-xl flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                        <p className="font-semibold text-xs sm:text-[13px] text-foreground leading-relaxed">
                          The club leader cannot be changed to Editor or Member.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {(["Editor", "Member"] as ClubPosition[]).map((role) => (
                        <div
                          key={role}
                          onClick={() => setSelectedPosition(role)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer touch-manipulation active:scale-[0.99] transition-transform select-none",
                            selectedPosition === role
                              ? "border-foreground bg-muted/50 shadow-sm"
                              : "border-border/60 hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="min-w-0">
                              <p className={cn("font-semibold text-xs sm:text-[13px]", selectedPosition === role ? "text-foreground" : "text-foreground/90")}>
                                {role === "Editor" ? "Editor" : role}
                              </p>
                            </div>
                          </div>
                          {selectedPosition === role && <Check className="h-4 w-4 text-foreground shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-muted/10 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:w-auto">
<Button
                    type="button"
                    variant="outline"
                    className="rounded-lg h-10 w-full sm:w-auto px-4 text-sm font-semibold touch-manipulation active:scale-[0.99] border-[var(--destructive)] text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)] transition-transform"
                    disabled={managingIsLeader}
                    onClick={() => initiateRemoveMember(managingMember)}
                  >
                    <UserMinus className="h-4 w-4 mr-2 " /> Remove
                  </Button>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg  h-10 flex-1 sm:flex-none sm:px-6 text-sm font-semibold touch-manipulation active:scale-[0.99] transition-transform"
                    onClick={() => setManagingMember(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    className="rounded-lg h-10 flex-1 sm:flex-none sm:px-6 text-sm font-semibold touch-manipulation active:scale-[0.99] transition-transform"
                    disabled={isSavingMember}
                    onClick={handleSaveMemberDetails}
                  >
                    {isSavingMember ? "Saving..." : managingIsLeader ? "Save Name" : "Save Role"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && !isRemovingMember && setMemberToRemove(null)}>
        <DialogContent className="max-w-md p-6 rounded-3xl border border-border/50 shadow-2xl bg-card">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted text-foreground flex items-center justify-center border border-border">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="font-bold text-base sm:text-lg uppercase tracking-wide text-foreground">
                Remove {memberToRemove?.name}?
              </DialogTitle>
              <DialogDescription className="font-semibold text-xs sm:text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                Please verify this action. <span className="font-bold text-foreground">{memberToRemove?.name}</span> will be removed from active rosters, analytics, and autocomplete lists.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 my-2 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-xs sm:text-[13px] text-foreground">
              <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
              <span>Historical match scores and checkpoints stay safe.</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-xs sm:text-[13px] text-foreground">
              <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
              <span>Past match records will not be deleted or modified.</span>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-2 flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-10 flex-1 text-sm sm:text-base font-semibold touch-manipulation active:scale-[0.99] transition-transform"
              onClick={() => setMemberToRemove(null)}
              disabled={isRemovingMember}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              className="rounded-xl h-10 flex-1 text-sm sm:text-base font-semibold touch-manipulation active:scale-[0.99] transition-transform"
              onClick={confirmAndExecuteRemoval}
              disabled={isRemovingMember}
            >
              <UserMinus className="h-4 w-4 mr-1.5" /> {isRemovingMember ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMatch} onOpenChange={(open) => !open && setEditingMatch(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border border-border/50 shadow-2xl">
          <div className="p-6">
            {editingMatch && (
              <MatchForm
                initialData={editingMatch}
                onCancel={() => setEditingMatch(null)}
                groupId={groupId}
                onSubmit={async (data) => {
                  await handleUpdateMatch(data);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <footer className="bg-background w-full pb-8 pt-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center">
          <div className="w-20 h-px bg-border/60 mb-8" />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 w-full max-w-lg">
            <Link href="/" className="text-[10px] font-bold text-foreground/40 tracking-widest uppercase hover:text-foreground transition-colors">
              Badminton Tracker
            </Link>
            <div className="flex items-center gap-8 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}