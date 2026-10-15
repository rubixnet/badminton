"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../../../../../convex/_generated/api";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  X
} from "lucide-react";
import type { Match } from "@/types/match";
import { cn, formatDateLabel, readOrigin } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  groupMatchesKey,
  useGroupMatches,
  useSession,
  type GroupMatches,
} from "@/lib/queries";
import Link from "next/link";

export default function SettingsPage() {
  const params = useParams();
  const groupId = params.groupid as string;

  const [copied, setCopied] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberName, setEditingMemberName] = useState("");
  const [memberEditError, setMemberEditError] = useState<string | null>(null);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [publicScoresError, setPublicScoresError] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isSavingPublicScores, setIsSavingPublicScores] = useState(false);

  const sessionQuery = useSession();
  const matchesQuery = useGroupMatches(groupId);
  const userSession = sessionQuery.data ?? null;
  const isAuthenticated = sessionQuery.isSuccess;
  const isMatchesLoading = matchesQuery.isPending;
  const queryClient = useQueryClient();

  const matches = useMemo(
    () => matchesQuery.data?.matches ?? [],
    [matchesQuery.data],
  );
  const uniquePlayersCount = useMemo(() => {
    const players = new Set<string>();
    matches.forEach((m) => {
      [...m.team1.players, ...m.team2.players].forEach((p) => p.name && players.add(p.name.trim()));
    });
    return players.size;
  }, [matches]);

  const profile = useQuery(api.users.getProfile, userSession?.userId ? { workosId: userSession.userId } : "skip");
  const group = useQuery(api.group.getGroupById, { groupId: groupId as any });
  const signedMembers = useQuery(api.users.getUsersByGroupId, { groupId });
  const updateMemberName = useMutation(api.users.updateMemberName);
  const updatePublicScores = useMutation(api.group.updatePublicScores);

  const { toast } = useToast();

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Are you sure you want to delete this match?")) return;

    try {
      const res = await fetch(`/api/matches?id=${matchId}`, { method: "DELETE" });
      if (res.ok) {
        queryClient.setQueryData<GroupMatches>(groupMatchesKey(groupId), (prev) =>
          prev
            ? { ...prev, matches: prev.matches.filter((m) => m.id !== matchId) }
            : prev,
        );
        toast({ title: "Success", description: "Match deleted successfully." });
      } else {
        throw new Error("Failed to delete");
      }
    } catch {
      toast({ title: "Error", description: "Could not delete match.", variant: "destructive" });
    }
  };

  const handleUpdateMatch = async (updatedData: any) => {
    if (!editingMatch) return;

    try {
      const res = await fetch("/api/matches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedData, id: editingMatch.id }),
      });

      if (res.ok) {
        queryClient.setQueryData<GroupMatches>(groupMatchesKey(groupId), (prev) =>
          prev
            ? {
                ...prev,
                matches: prev.matches.map((m) =>
                  m.id === editingMatch.id ? { ...m, ...updatedData } : m,
                ),
              }
            : prev,
        );
        setEditingMatch(null);
        toast({ title: "Success", description: "Match updated successfully." });
      } else {
        throw new Error("Failed to update");
      }
    } catch {
      toast({ title: "Error", description: "Could not update match.", variant: "destructive" });
    }
  };
  const handleCopy = () => {
    const inviteLink = `${readOrigin()}/invite/${group?.inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    // Navigation, not fetch: the middleware sees `logout=` on /login and clears
    // the session cookie there.
    window.location.href = "/login?logout=success";
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
  const inviteLink = group ? `${readOrigin()}/invite/${group.inviteCode}` : "";
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

  // An expired session used to `router.push("/login")` from an effect. Bouncing
  // the user with a client-side navigation tears down and rebuilds the whole
  // route tree; showing the sign-in prompt in place keeps the shell mounted and
  // still offers the one action the user needs.
  if (sessionQuery.isError) {
    return <SessionExpiredNotice />;
  }

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
          <StatsRow
            memberCount={uniquePlayersCount}
            isAdmin={isAdmin}
          />

          <InviteLinkCard
            inviteLink={inviteLink}
            copied={copied}
            onCopy={handleCopy}
          />

          <PublicScoresCard
            isAdmin={isAdmin}
            enabled={publicScoresEnabled}
            isSaving={isSavingPublicScores}
            hasGroup={Boolean(group)}
            error={publicScoresError}
            onToggle={handlePublicScoresChange}
          />
            <MembersCard
              members={signedMembers ?? []}
              isAdmin={isAdmin}
              editingMemberId={editingMemberId}
              editingMemberName={editingMemberName}
              savingMemberId={savingMemberId}
              error={memberEditError}
              adminId={group?.adminId?.toString()}
              onStartEdit={startEditingMember}
              onChangeName={setEditingMemberName}
              onCancelEdit={cancelEditingMember}
              onSave={saveMemberName}
            />

          {isAuthenticated && isAdmin && (
            <MatchManagementCard
              matches={matchesQuery.data?.matches ?? []}
              isLoading={isMatchesLoading}
              onEdit={setEditingMatch}
              onDelete={handleDeleteMatch}
            />
          )}

          <SignOutCard email={userSession?.email} onSignOut={handleLogout} />
        </div>
      </main>

      <Dialog open={!!editingMatch} onOpenChange={(open) => !open && setEditingMatch(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border border-border/50 shadow-2xl">

          <div className="p-6">
            {editingMatch && (
              <MatchForm
                initialData={editingMatch}
                onCancel={() => setEditingMatch(null)}
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

/** Public-scores toggle card. Read-only copy for non-admins. */
function PublicScoresCard({
  isAdmin,
  enabled,
  isSaving,
  hasGroup,
  error,
  onToggle,
}: {
  isAdmin: boolean;
  enabled: boolean;
  isSaving: boolean;
  hasGroup: boolean;
  error: string | null;
  onToggle: (checked: boolean) => void;
}) {
  return (
      <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-base text-balance">Public Scores</CardTitle>
            <CardDescription>
              Allow anyone with the club link to view scores and analytics without signing in.
            </CardDescription>
          </div>
          <Switch
            checked={enabled}
            disabled={!isAdmin || isSaving || !hasGroup}
            onCheckedChange={onToggle}
            aria-label="Make scores public"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            {isAdmin
              ? enabled
                ? "Scores are public. New matches still require a signed-in member."
                : "Scores are private by default."
              : "Only the club admin can change this setting."}
          </p>
          {error && (
            <p className="mt-3 rounded-lg border border-[var(--destructive)]/25 bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
              {error}
            </p>
          )}
        </CardContent>
          </Card>
  );
}

/** Verified-member roster with inline rename for admins. */
function MembersCard({
  members,
  isAdmin,
  adminId,
  editingMemberId,
  editingMemberName,
  savingMemberId,
  error,
  onStartEdit,
  onChangeName,
  onCancelEdit,
  onSave,
}: {
  members: any[];
  isAdmin: boolean;
  /** Group founder id, used for the "Founder" badge. */
  adminId?: string;
  editingMemberId: string | null;
  editingMemberName: string;
  savingMemberId: string | null;
  error: string | null;
  onStartEdit: (member: any) => void;
  onChangeName: (value: string) => void;
  onCancelEdit: () => void;
  onSave: (memberId: string) => void;
}) {
  return (
      <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="space-y-1.5">
            <CardTitle className="text-base text-balance">Verified Members</CardTitle>
            <CardDescription>Players currently authenticated in the roster.</CardDescription>
          </div>
          <Badge variant="outline" className="rounded-lg border-border/50 font-medium tabular-nums text-xs shadow-none">
            {members.length} Total
          </Badge>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-lg border border-[var(--destructive)]/25 bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {members.map((member: any) => (
              <div key={member._id} className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-background hover:bg-muted/30 transition-colors">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs flex items-center justify-center font-medium shrink-0">
                    {(member.name || "?").charAt(0).toUpperCase()}
                  </div>
                  {editingMemberId === member._id ? (
                    <Input
                      value={editingMemberName}
                      onChange={(event) => onChangeName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") onSave(member._id);
                        if (event.key === "Escape") onCancelEdit();
                      }}
                      className="h-9 min-w-0 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate text-sm font-medium text-foreground/90">{member.name}</span>
                  )}
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-1">
                  {member._id?.toString() === adminId && (
                    <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground shadow-none">
                      Founder
                    </Badge>
                  )}
                  {isAdmin && editingMemberId !== member._id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                      onClick={() => onStartEdit(member)}
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
                        onClick={() => onSave(member._id)}
                      >
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Save member</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-[var(--destructive)]"
                        disabled={savingMemberId === member._id}
                        onClick={onCancelEdit}
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
  );
}

/** Recent-match table with edit/delete actions. */
function MatchManagementCard({
  matches,
  isLoading,
  onEdit,
  onDelete,
}: {
  matches: Match[];
  isLoading: boolean;
  onEdit: (match: Match) => void;
  onDelete: (matchId: string) => void;
}) {
  return (
        <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-balance">Match Management</CardTitle>
            <CardDescription>Edit or remove recent matches.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-col border border-border/50 rounded-xl bg-background overflow-hidden">

              {isLoading ? (
                <div className="p-10 flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm font-medium text-muted-foreground">Loading matches...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <p className="text-sm font-medium text-foreground/80">No matches recorded yet</p>
                </div>
              ) : (
                <>
                  {matches.slice(0, 5).map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest tabular-nums">
                          {formatDateLabel(match.createdAt)}
                        </p>
                        <div className="text-sm font-medium text-foreground/90">
                          {match.team1.players.map(p => p.name).join(" & ")} vs {match.team2.players.map(p => p.name).join(" & ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit match on ${formatDateLabel(match.createdAt)}`}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary transition-transform"
                          onClick={() => onEdit(match)}
                        >
                          <Edit3 className="h-4 w-4 shrink-0" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete match on ${formatDateLabel(match.createdAt)}`}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-[var(--destructive)] transition-transform"
                          onClick={() => onDelete(match.id)}
                        >
                          <Trash2 className="h-4 w-4 shrink-0" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
          </Card>
  );
}

/** The two headline stats above the settings cards. */
function StatsRow({ memberCount, isAdmin }: { memberCount: number; isAdmin: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-2xl border-border/50 bg-card shadow-sm p-5 sm:p-6 flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Members</span>
              <Users className="h-4 w-4 opacity-40 shrink-0" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">{memberCount}</div>
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
  );
}

/** Shareable invite link with a copy-to-clipboard button. */
function InviteLinkCard({
  inviteLink,
  copied,
  onCopy,
}: {
  inviteLink: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
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
                  className="pl-9 h-10 py-1 bg-background border-border/50 rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
                />
              </div>
              <Button
                onClick={onCopy}
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
  );
}

/** Shown in place of the settings form when the session cannot be resolved. */
function SessionExpiredNotice() {
  return (

  <div className="min-h-screen bg-background font-sans overflow-x-hidden">
    <Navbar title="Settings" />
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-medium tracking-tight">
          Session expired
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in again to manage this group.
        </p>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full rounded-md border-border/50",
          )}
        >
          Sign in
        </Link>
      </div>
    </div>
  </div>
  );
}

/** Sign-out card: shows the signed-in address and the sign-out action. */
function SignOutCard({ email, onSignOut }: { email?: string; onSignOut: () => void }) {
  return (
        <Card className="rounded-2xl border-border/50 bg-card shadow-sm mt-4">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-base font-medium text-foreground/90">Sign Out</h3>
              <p className="text-sm text-muted-foreground font-normal">
                Logged in as <span className="text-foreground/80 font-medium">{email}</span>
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full sm:w-auto border-[var(--destructive)] text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)] rounded-xl h-10 px-6 text-sm font-medium transition-colors active:scale-[0.96] shadow-none shrink-0"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4 mr-2 shrink-0" /> Sign Out
            </Button>
          </CardContent>
        </Card>
  );
}
