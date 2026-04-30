"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Copy, 
  Check, 
  Users, 
  Shield, 
  Link as LinkIcon, 
  Edit3, 
  Trash2, 
  LogOut,
  ChevronRight,
  X
} from "lucide-react";
import type { Match } from "@/types/match";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupid as string;

  const [copied, setCopied] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [uniquePlayersCount, setUniquePlayersCount] = useState(0);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberName, setEditingMemberName] = useState("");
  const [memberEditError, setMemberEditError] = useState<string | null>(null);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [publicScoresError, setPublicScoresError] = useState<string | null>(null);
  const [isSavingPublicScores, setIsSavingPublicScores] = useState(false);
  
  const [userSession, setUserSession] = useState<{ userId: string; name?: string; email?: string } | null>(null);

  const profile = useQuery(api.users.getProfile, userSession?.userId ? { workosId: userSession.userId } : "skip");
  const group = useQuery(api.group.getGroupById, { groupId: groupId as any });
  const signedMembers = useQuery(api.users.getUsersByGroupId, { groupId });
  const updateMemberName = useMutation(api.users.updateMemberName);
  const updatePublicScores = useMutation(api.group.updatePublicScores);

  useEffect(() => {
    const fetchSession = async () => {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
            const data = await res.json();
            setUserSession(data);
        } else {
            router.push("/login");
        }
    };
    fetchSession();

    const fetchMatches = async () => {
      if (!groupId) return;
      try {
        const res = await fetch(`/api/analytics?groupId=${groupId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.matches) {
            setMatches(data.matches);
            const players = new Set<string>();
            data.matches.forEach((m: Match) => {
              [...m.team1.players, ...m.team2.players].forEach((p) => p.name && players.add(p.name.trim()));
            });
            setUniquePlayersCount(players.size);
          }
        }
      } catch (e) { console.error(e); }
    };
    fetchMatches();
  }, [groupId, router]);

  const handleCopy = () => {
    const inviteLink = `${window.location.origin}/invite/${group?.inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/api/auth/logout";
  };

  const startEditingMember = (member: any) => {
    setMemberEditError(null);
    setEditingMemberId(member._id);
    setEditingMemberName(member.name || "");
  };

  const cancelEditingMember = () => {
    setMemberEditError(null);
    setEditingMemberId(null);
    setEditingMemberName("");
  };

  const saveMemberName = async (memberId: string) => {
    if (!userSession?.userId) return;

    const nextName = editingMemberName.trim();
    if (!nextName) {
      setMemberEditError("Member name is required.");
      return;
    }

    setSavingMemberId(memberId);
    setMemberEditError(null);

    try {
      await updateMemberName({
        adminWorkosId: userSession.userId,
        memberId: memberId as any,
        name: nextName,
      });
      cancelEditingMember();
    } catch (error) {
      setMemberEditError(
        error instanceof Error ? error.message : "Failed to update member.",
      );
    } finally {
      setSavingMemberId(null);
    }
  };

  const isAdmin = profile?._id?.toString() === group?.adminId?.toString();
  const inviteLink = group ? `${window.location.origin}/invite/${group.inviteCode}` : "";
  const publicScoresEnabled = Boolean(group?.isPublic);

  const handlePublicScoresChange = async (checked: boolean) => {
    if (!isAdmin || !userSession?.userId || !group?._id) return;

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

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
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
                <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">{uniquePlayersCount}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1 truncate">Players logged in records</p>
              </div>
            </Card>

            <Card className="rounded-2xl border-border/50 bg-card shadow-sm p-5 sm:p-6 flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Your Rank</span>
                <Shield className="h-4 w-4 opacity-40 shrink-0" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight">{isAdmin ? "Admin" : "Member"}</div>
                  {isAdmin && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1 truncate">Current access level</p>
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
                    className="pl-9 h-10 bg-background border-border/50 rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary shadow-sm" 
                  />
                </div>
                <Button 
                  onClick={handleCopy} 
                  variant={copied ? "secondary" : "default"}
                  className={cn(
                    "rounded-xl h-10 px-5 text-sm font-medium transition-colors active:scale-[0.96] w-full sm:w-auto shrink-0 shadow-sm",
                    copied && "bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20"
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
                disabled={!isAdmin || isSavingPublicScores || !group}
                onCheckedChange={handlePublicScoresChange}
                aria-label="Make scores public"
              />
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                {isAdmin
                  ? publicScoresEnabled
                    ? "Scores are public. New matches still require a signed-in member."
                    : "Scores are private by default."
                  : "Only the club admin can change this setting."}
              </p>
              {publicScoresError && (
                <p className="mt-3 rounded-lg border border-[var(--destructive)]/25 bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
                  {publicScoresError}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div className="space-y-1.5">
                <CardTitle className="text-base text-balance">Verified Members</CardTitle>
                <CardDescription>Players currently authenticated in the roster.</CardDescription>
              </div>
              <Badge variant="outline" className="rounded-lg border-border/50 font-medium tabular-nums text-xs shadow-none">
                {signedMembers?.length || 0} Total
              </Badge>
            </CardHeader>
            <CardContent>
              {memberEditError && (
                <p className="mb-4 rounded-lg border border-[var(--destructive)]/25 bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
                  {memberEditError}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {signedMembers?.map((member: any) => (
                  <div key={member._id} className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-background hover:bg-muted/30 transition-colors">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs flex items-center justify-center font-medium shrink-0">
                        {(member.name || "?").charAt(0).toUpperCase()}
                      </div>
                      {editingMemberId === member._id ? (
                        <Input
                          value={editingMemberName}
                          onChange={(event) => setEditingMemberName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") saveMemberName(member._id);
                            if (event.key === "Escape") cancelEditingMember();
                          }}
                          className="h-9 min-w-0 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span className="truncate text-sm font-medium text-foreground/90">{member.name}</span>
                      )}
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-1">
                      {member._id?.toString() === group?.adminId?.toString() && (
                        <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground shadow-none">
                          Founder
                        </Badge>
                      )}
                      {isAdmin && editingMemberId !== member._id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                          onClick={() => startEditingMember(member)}
                        >
                          <Edit3 className="h-4 w-4" />
                          <span className="sr-only">Edit member</span>
                        </Button>
                      )}
                      {isAdmin && editingMemberId === member._id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                            disabled={savingMemberId === member._id}
                            onClick={() => saveMemberName(member._id)}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Save member</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-[var(--destructive)]"
                            disabled={savingMemberId === member._id}
                            onClick={cancelEditingMember}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Cancel edit</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-balance">Match Management</CardTitle>
                <CardDescription>Edit or remove recent matches.</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex flex-col border border-border/50 rounded-xl bg-background overflow-hidden">
                  {matches.slice(0, 5).map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest tabular-nums">
                          {new Date(match.createdAt).toLocaleDateString()}
                        </p>
                        <div className="text-sm font-medium text-foreground/90">
                          {match.team1.players.map(p => p.name).join(" & ")} vs {match.team2.players.map(p => p.name).join(" & ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary active:scale-[0.96] transition-transform">
                          <Edit3 className="h-4 w-4 shrink-0" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-[var(--destructive)] active:scale-[0.96] transition-transform">
                          <Trash2 className="h-4 w-4 shrink-0" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {matches.length > 5 && (
                    <div className="p-2 bg-muted/10">
                      <Button variant="ghost" className="w-full rounded-lg h-9 text-xs font-medium text-muted-foreground hover:text-primary transition-colors active:scale-[0.96]">
                        View all records <ChevronRight className="w-3 h-3 ml-1 shrink-0" />
                      </Button>
                    </div>
                  )}
                  {matches.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No matches recorded yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-border/50 bg-card shadow-sm mt-4">
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-base font-medium text-foreground/90">Sign Out</h3>
                <p className="text-sm text-muted-foreground font-normal">
                  Logged in as <span className="text-foreground/80 font-medium">{userSession?.email}</span>
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto border-[var(--destructive)] text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)] rounded-xl h-10 px-6 text-sm font-medium transition-colors active:scale-[0.96] shadow-none shrink-0"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2 shrink-0" /> Sign Out
              </Button>
            </CardContent>
          </Card>

        </div>
      </main>

      <footer className="bg-background w-full pb-8 pt-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center">
          <div className="w-20 h-px bg-border/60 mb-8" />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 w-full max-w-lg">
            <Link href="/" className="text-[10px] font-bold text-foreground/40 tracking-widest uppercase hover:text-primary transition-colors">
              Badminton Tracker
            </Link>
            <div className="flex items-center gap-8 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
