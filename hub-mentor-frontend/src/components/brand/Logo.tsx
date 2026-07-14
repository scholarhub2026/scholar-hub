import { cn } from "@/lib/utils";

/**
 * Brand logo — the graduation-cap "Scholar Hub" mark in public/og-image.png.
 * Single source of truth so the logo stays consistent across nav, footer,
 * auth, and the dashboard shells. Size it with a height class, e.g.
 * <Logo className="h-11" />.
 */
const Logo = ({ className }: { className?: string }) => (
  <img
    src="/og-image.png"
    alt="Scholar Hub"
    draggable={false}
    className={cn("h-10 w-auto object-contain select-none", className)}
  />
);

export default Logo;
