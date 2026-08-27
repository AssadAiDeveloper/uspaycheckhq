"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  /** Extra paths (besides `href` itself) that should also count as "active" for this link. */
  activeOn?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Calculator" },
  { href: "/#states", label: "All states" },
  // Accepts either /about or /methodology as the active path, so this stays
  // correct even if the route is ever renamed.
  { href: "/about", label: "Methodology", activeOn: ["/about", "/methodology"] },
];

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="hidden sm:flex items-center gap-6 text-sm text-slate-300"
    >
      {NAV_ITEMS.map((item) => {
        const matchPaths = item.activeOn ?? [item.href];
        const isActive = matchPaths.includes(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "font-medium text-white"
                : "text-slate-300 hover:text-white transition-colors"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
