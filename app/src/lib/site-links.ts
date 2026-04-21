export type SiteLink = {
  href: string;
  label: string;
  description: string;
};

export const primaryNavLinks: Array<Pick<SiteLink, "href" | "label">> = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/whitepaper", label: "White Paper" },
  { href: "/docs", label: "Docs" },
  { href: "/live", label: "Live Feed" },
  { href: "/dashboard", label: "Dashboard" },
];

export const supportPages: SiteLink[] = [
  {
    href: "/about",
    label: "About",
    description: "Mission, origin, and operating principles.",
  },
  {
    href: "/whitepaper",
    label: "White Paper",
    description: "Protocol architecture, trust model, and execution flow.",
  },
  {
    href: "/docs",
    label: "Docs",
    description: "Entry point for product, technical, and launch documentation.",
  },
  {
    href: "/status",
    label: "Status",
    description: "Current deployment posture and launch state.",
  },
  {
    href: "/team",
    label: "Team",
    description: "Core contributors and accountability model.",
  },
  {
    href: "/roadmap",
    label: "Roadmap",
    description: "What ships next from devnet to mainnet.",
  },
  {
    href: "/faq",
    label: "FAQ",
    description: "Common questions from users, judges, and operators.",
  },
  {
    href: "/security",
    label: "Security",
    description: "Risk controls, audit prep, and incident response.",
  },
  {
    href: "/contact",
    label: "Contact",
    description: "How to reach the project and report issues.",
  },
  {
    href: "/terms",
    label: "Terms",
    description: "Usage terms and service conditions.",
  },
  {
    href: "/privacy",
    label: "Privacy",
    description: "How TavSin handles site and wallet data.",
  },
];
