"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Match } from "@/types/match";
import { AdminMatchTable } from "@/components/admin-match-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);

      // Try loading from cache first
      const stored = localStorage.getItem("badminton_matches");
      let loadedFromCache = false;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMatches(parsed);
            setLoading(false);
            loadedFromCache = true;
          }
        } catch (e) {
          console.error(e);
        }
      }

      fetchMatches(loadedFromCache);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMatches = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch("/api/matches?limit=100"); // Fetch more for admin
      if (res.ok) {
        const data = await res.json();
        const newMatches = data.matches || [];
        setMatches(newMatches);
        localStorage.setItem("badminton_matches", JSON.stringify(newMatches));
      }
    } catch (error) {
      console.error("Failed to fetch matches", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Gaurav", password: code }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem("admin_auth", "true");
        fetchMatches();
        toast({ title: "Success", description: "Logged in successfully" });
      } else {
        toast({
          title: "Error",
          description: "Invalid code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_auth");
    setCode("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this match?")) return;

    try {
      const res = await fetch(`/api/matches?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        const newMatches = matches.filter((m) => m.id !== id);
        setMatches(newMatches);
        localStorage.setItem("badminton_matches", JSON.stringify(newMatches));
        toast({ title: "Success", description: "Match deleted" });
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete match",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (updatedMatch: Match) => {
    try {
      const res = await fetch("/api/matches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMatch),
      });

      if (res.ok) {
        const newMatches = matches.map((m) =>
          m.id === updatedMatch.id ? updatedMatch : m,
        );
        setMatches(newMatches);
        localStorage.setItem("badminton_matches", JSON.stringify(newMatches));
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      throw error;
    }
  };

  const handleCreate = async (matchData: any) => {
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchData),
      });

      if (res.ok) {
        const newMatch = await res.json();
        const newMatches = [newMatch, ...matches];
        setMatches(newMatches);
        localStorage.setItem("badminton_matches", JSON.stringify(newMatches));
      } else {
        throw new Error("Failed to create");
      }
    } catch (error) {
      throw error;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Admin Access
            </CardTitle>
            <CardDescription>
              Enter the admin code to manage matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter admin code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={verifying}>
                  {verifying ? "Loading..." : "Login"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-background">

      <div className="max-w-6xl pt-10 mx-auto px-2 md:px-6 space-y-8">
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4">
                {/* Quick Add Skeleton */}
                <div className="border p-4 bg-muted/30 rounded-lg">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <div className="flex lg:grid lg:grid-cols-12 gap-2">
                    <div className="lg:col-span-3 flex gap-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 w-[100px]" />
                    </div>
                    <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                      <Skeleton className="h-9" />
                      <Skeleton className="h-9" />
                    </div>
                    <div className="lg:col-span-2 flex gap-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 flex-1" />
                    </div>
                    <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                      <Skeleton className="h-9" />
                      <Skeleton className="h-9" />
                    </div>
                    <div className="lg:col-span-1">
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </div>
                </div>

                {/* Table Skeleton */}
                <div className="rounded-md border">
                  <div className="h-10 border-b bg-muted/50 px-4 flex items-center">
                    <Skeleton className="h-4 w-full" />
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="p-4 border-b flex items-center gap-4"
                    >
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <AdminMatchTable
                data={matches}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onCreate={handleCreate}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
