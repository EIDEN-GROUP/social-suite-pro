import type { ReactNode } from "react";

/**
 * Just the drifting gradient-orb + grain layer, positioned `absolute inset-0`.
 * Place it first inside a `relative overflow-hidden` container and render real
 * content above it in a `relative z-10` wrapper. Pass `accent` (a hex colour)
 * to tint the lead orb to a client's brand.
 */
export function AuroraLayer({ accent }: { accent?: string }) {
  const lead = accent || "#dc2743";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="animate-aurora absolute -left-[14%] -top-[18%] h-[58vw] w-[58vw] max-w-[720px] rounded-full opacity-60 blur-[120px]"
        style={{ background: `radial-gradient(circle at 35% 35%, ${lead}, transparent 68%)` }}
      />
      <div
        className="animate-aurora absolute right-[-16%] top-[4%] h-[50vw] w-[50vw] max-w-[620px] rounded-full opacity-45 blur-[120px] [animation-delay:-8s]"
        style={{ background: "radial-gradient(circle at 50% 50%, #405de6, transparent 68%)" }}
      />
      <div
        className="animate-aurora absolute bottom-[-22%] left-[22%] h-[48vw] w-[48vw] max-w-[600px] rounded-full opacity-40 blur-[120px] [animation-delay:-15s]"
        style={{ background: "radial-gradient(circle at 50% 50%, #bc1888, transparent 68%)" }}
      />
      <div className="grain absolute inset-0" />
    </div>
  );
}

/**
 * Full-screen centred aurora shell: a frosted glass card floats over the
 * living-gradient backdrop. Used by the studio /auth login.
 */
export function AuthAura({ accent, children }: { accent?: string; children: ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="absolute inset-0 -z-10">
        <AuroraLayer accent={accent} />
      </div>
      {children}
    </main>
  );
}
