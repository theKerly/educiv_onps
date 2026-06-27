import type { ReactNode } from "react";

export function PageShell({
  title, subtitle, badge, actions, children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-[color:var(--ci-orange)]/10 text-[color:var(--ci-orange)] px-2 py-0.5 font-medium">ONPS</span>
            {badge && <span className="rounded-full bg-[color:var(--ci-green)]/10 text-[color:var(--ci-green)] px-2 py-0.5 font-medium">{badge}</span>}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-2">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </header>
      <main className="flex flex-col gap-6">{children}</main>
    </div>
  );
}