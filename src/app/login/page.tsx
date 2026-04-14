"use client";

import { useState } from "react";
import { GalleryVerticalEnd, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup, FieldSeparator, FieldDescription } from "@/components/ui/field";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        setError(data.error || "Invalid email or password. Please try again.");
      }
    } catch (err) {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <Link href="/" className="flex flex-col items-center gap-2 self-center font-medium">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Badminton Tracker</span>
        </Link>

        <form onSubmit={onLogin} className="flex flex-col gap-6">
          <FieldGroup>
            <div className="flex flex-col items-center gap-1 text-center mb-2">
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground">
                Enter your details to access your matches
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive mt-2">
                <AlertCircle className="size-4" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input border-border rounded-lg"
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/api/auth/forgot-password"
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border rounded-lg"
                />
              </Field>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 rounded-full font-medium mt-2">
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <FieldSeparator>Or continue with</FieldSeparator>

            <Button
              variant="outline"
              type="button"
              onClick={onGoogleLogin}
              className="h-11 rounded-full border-border bg-transparent hover:bg-secondary flex gap-3"
            >
              <svg
                className="size-5"
                viewBox="0 0 26 26"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fill="#4285F4" d="M23.622 12.273c0-.745-.068-1.462-.196-2.155h-11.45v4.077h6.54a5.591 5.591 0 0 1-2.397 3.673l3.875 3.011c2.264-2.084 3.628-5.153 3.628-8.606Z" />
                <path fill="#34A853" d="M11.977 23.8c3.287 0 6.04-1.08 8.054-2.931l-3.875-3.011c-1.08.726-2.46 1.154-4.179 1.154-3.205 0-5.921-2.165-6.899-5.077H1.961v3.18A10.994 10.994 0 0 0 11.977 23.8Z" />
                <path fill="#FBBC05" d="M5.078 13.935a6.599 6.599 0 0 1-.345-2.135c0-.74.125-1.457.345-2.135V6.485H1.961A10.994 10.994 0 0 0 1 11.8c0 1.745.404 3.395 1.118 4.88z" />
                <path fill="#EA4335" d="M11.977 4.507c1.788 0 3.4.614 4.667 1.816l3.498-3.498C18.01 1.635 15.258.8 11.977.8 7.023.8 2.88 3.5 1.118 7.92l3.117 2.48C5.977 6.672 8.793 4.507 11.977 4.507Z" />
              </svg>
              Google
            </Button>

            <FieldDescription className="text-center mt-4">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline underline-offset-4 font-semibold text-foreground">
                Sign up
              </Link>
            </FieldDescription>
          </FieldGroup>
        </form>

        <footer className="text-center text-xs text-muted-foreground flex justify-center gap-4">
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
        </footer>
      </div>
    </div>
  );
}