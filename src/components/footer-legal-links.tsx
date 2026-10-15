import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The Terms / Privacy pair shared by every marketing-page footer.
 *
 * Both the landing page and the invite page render this, so it lives here
 * instead of being copy-pasted - otherwise the two footers drift apart the next
 * time a link or a class changes.
 */
export function FooterLegalLinks({
  className,
  linkClassName,
}: {
  className?: string;
  linkClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-8 text-[10px] text-muted-foreground font-bold uppercase tracking-widest",
        className,
      )}
    >
      <Link href="/terms" className={cn("transition-colors", linkClassName)}>
        Terms
      </Link>
      <Link href="/privacy" className={cn("transition-colors", linkClassName)}>
        Privacy
      </Link>
    </div>
  );
}