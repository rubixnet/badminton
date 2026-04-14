"use client";

import { useState } from "react";
import { GalleryVerticalEnd, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldSeparator,
  FieldDescription
} from "@/components/ui/field";

export default function SignupPage() {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignupDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserId(data.userId);
        setStep("otp");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyAndCreate = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ userId, code }),
      });
      if (res.ok) {
        window.location.href = "/onboarding";
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError("Verification failed.");
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

        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-1 text-center mb-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {step === "details" ? "Create an account" : "Verify your email"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === "details"
                ? "Join the club and start tracking scores"
                : `Enter the code we sent to ${email}`}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {step === "details" ? (
            <form onSubmit={onSignupDetails} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input rounded-lg"
                  />
                </Field>
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input rounded-lg"
                  />
                </Field>
                <Button type="submit" disabled={loading} className="w-full h-11 rounded-full font-medium">
                  {loading ? "Preparing..." : "Create Account"}
                </Button>
                <FieldSeparator>Or sign up with</FieldSeparator>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => window.location.href = "/api/auth/google"}
                  className="w-full h-11 rounded-full border-border bg-transparent hover:bg-secondary flex gap-2"
                >
                  Google
                </Button>
              </FieldGroup>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <InputOTP 
                maxLength={6} 
                value={code} 
                onChange={(val) => setCode(val)}
                onComplete={onVerifyAndCreate}
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="rounded-md border h-12 w-10 text-xl" />
                  <InputOTPSlot index={1} className="rounded-md border h-12 w-10 text-xl" />
                  <InputOTPSlot index={2} className="rounded-md border h-12 w-10 text-xl" />
                  <InputOTPSlot index={3} className="rounded-md border h-12 w-10 text-xl" />
                  <InputOTPSlot index={4} className="rounded-md border h-12 w-10 text-xl" />
                  <InputOTPSlot index={5} className="rounded-md border h-12 w-10 text-xl" />
                </InputOTPGroup>
              </InputOTP>

              <Button 
                onClick={onVerifyAndCreate} 
                disabled={loading || code.length !== 6} 
                className="w-full h-11 rounded-full font-medium"
              >
                {loading ? "Verifying..." : "Confirm & Join"}
              </Button>
              <button
                onClick={() => setStep("details")}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Edit account details
              </button>
            </div>
          )}

          <FieldDescription className="text-center mt-4">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4 font-semibold text-foreground">
              Sign in
            </Link>
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}