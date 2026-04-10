import Link from "next/link";

type PageStat = {
  label: string;
  value: string;
  note?: string;
};

type PageSection = {
  eyebrow?: string;
  title: string;
  body: string;
  bullets?: string[];
};

type PageCard = {
  href: string;
  title?: string;
  label?: string;
  description: string;
  external?: boolean;
};

type PageFrameProps = {
  badge: string;
  title: string;
  lead: string;
  stats?: PageStat[];
  sections: PageSection[];
  cards?: PageCard[];
  primaryCta?: { href: string; label: string; external?: boolean };
  secondaryCta?: { href: string; label: string; external?: boolean };
  tertiaryCta?: { href: string; label: string; external?: boolean };
};

function renderLink(
  href: string,
  label: string,
  external: boolean | undefined,
  className: string,
) {
  if (external || href.startsWith("http") || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        target={href.startsWith("mailto:") ? undefined : "_blank"}
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export default function PageFrame({
  badge,
  title,
  lead,
  stats,
  sections,
  cards,
  primaryCta,
  secondaryCta,
  tertiaryCta,
}: PageFrameProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.1),transparent_20%),linear-gradient(180deg,rgba(10,15,30,0.88),rgba(10,15,30,1))]" />
      </div>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
            {badge}
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-[4.8rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
            {lead}
          </p>

          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryCta &&
                renderLink(
                  primaryCta.href,
                  primaryCta.label,
                  primaryCta.external,
                  "inline-flex items-center justify-center rounded-2xl border border-cyan-300/30 bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition-transform hover:-translate-y-0.5",
                )}
              {secondaryCta &&
                renderLink(
                  secondaryCta.href,
                  secondaryCta.label,
                  secondaryCta.external,
                  "inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/8",
                )}
              {tertiaryCta &&
                renderLink(
                  tertiaryCta.href,
                  tertiaryCta.label,
                  tertiaryCta.external,
                  "inline-flex items-center justify-center rounded-2xl border border-white/8 bg-transparent px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200 transition-colors hover:border-white/12 hover:bg-white/[0.04] hover:text-white",
                )}
            </div>
          )}
        </div>

        {stats && stats.length > 0 && (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="text-3xl font-semibold tracking-[-0.04em] text-white">{stat.value}</div>
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                  {stat.label}
                </div>
                {stat.note && <div className="mt-2 text-sm leading-6 text-slate-200">{stat.note}</div>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6">
              {section.eyebrow && (
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
                  {section.eyebrow}
                </div>
              )}
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                {section.title}
              </h2>
              <p className="mt-4 leading-7 text-slate-200">{section.body}</p>
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-100">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {cards && cards.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Related
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/20"
                >
                  <div className="text-lg font-semibold text-white">
                    {card.title ?? card.label}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-200">{card.description}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
