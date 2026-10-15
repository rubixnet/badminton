"use client";

import { ReactNode, useState } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "@/components/theme-provider";
import { ColorModeProvider } from "@/components/color-mode-provider";
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: false },
        },
      }),
  );

  return (
    <MotionConfig reducedMotion="user">
      {/* `domAnimation` is loaded once here, so the `m.*` components used by the
          routes below skip re-parsing the animation feature bundle on mount. */}
      <LazyMotion features={domAnimation}>
      <QueryClientProvider client={queryClient}>
        <ConvexProvider client={convex}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ColorModeProvider>
              <ToastProvider>
                <AnchoredToastProvider>{children}</AnchoredToastProvider>
              </ToastProvider>
            </ColorModeProvider>
          </ThemeProvider>
        </ConvexProvider>
      </QueryClientProvider>
      </LazyMotion>
    </MotionConfig>
  );
}
