"use client";

import { GalleryVerticalEnd} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const onGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-6 text-foreground">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-sm flex flex-col gap-8">
          <Link href="/" className="flex flex-col items-center gap-2 self-center font-medium">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Sign Up for Badminton Tracker</span>
          </Link>
          <Button
            variant="outline"
            type="button"
            onClick={onGoogleLogin}
            className="rounded-full py-5 !text-lg border-border bg-transparent hover:bg-secondary flex gap-3"
          >
            <svg className="size-6" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M23.622 12.273c0-.745-.068-1.462-.196-2.155h-11.45v4.077h6.54a5.591 5.591 0 0 1-2.397 3.673l3.875 3.011c2.264-2.084 3.628-5.153 3.628-8.606Z" />
              <path fill="#34A853" d="M11.977 23.8c3.287 0 6.04-1.08 8.054-2.931l-3.875-3.011c-1.08.726-2.46 1.154-4.179 1.154-3.205 0-5.921-2.165-6.899-5.077H1.961v3.18A10.994 10.994 0 0 0 11.977 23.8Z" />
              <path fill="#FBBC05" d="M5.078 13.935a6.599 6.599 0 0 1-.345-2.135c0-.74.125-1.457.345-2.135V6.485H1.961A10.994 10.994 0 0 0 1 11.8c0 1.745.404 3.395 1.118 4.88z" />
              <path fill="#EA4335" d="M11.977 4.507c1.788 0 3.4.614 4.667 1.816l3.498-3.498C18.01 1.635 15.258.8 11.977.8 7.023.8 2.88 3.5 1.118 7.92l3.117 2.48C5.977 6.672 8.793 4.507 11.977 4.507Z" />
            </svg>
            Google
          </Button>
        </div>
      </div>
      <footer className="text-center text-sm text-muted-foreground flex justify-center gap-4 mt-auto px-6">
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}