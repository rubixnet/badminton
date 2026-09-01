"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "@/components/theme-provider";
import { ColorModeProvider } from "@/components/color-mode-provider";
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ColorModeProvider>
          <ToastProvider>
            <AnchoredToastProvider>
              {children}
            </AnchoredToastProvider>
          </ToastProvider>
        </ColorModeProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}
