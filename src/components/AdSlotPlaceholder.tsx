interface AdSlotPlaceholderProps {
  variant: "top-banner" | "sidebar" | "bottom-banner";
  className?: string;
}

const VARIANT_CONFIG: Record<
  AdSlotPlaceholderProps["variant"],
  { minHeight: string; label: string; sizeHint: string }
> = {
  "top-banner": {
    minHeight: "min-h-[90px]",
    label: "Advertisement",
    sizeHint: "728×90 / responsive leaderboard",
  },
  sidebar: {
    minHeight: "min-h-[250px]",
    label: "Advertisement",
    sizeHint: "300×250 / sticky sidebar",
  },
  "bottom-banner": {
    minHeight: "min-h-[250px]",
    label: "Advertisement",
    sizeHint: "responsive rectangle",
  },
};

/**
 * Reserves a fixed-aspect-ratio slot for a Google AdSense unit so ad load
 * never shifts surrounding layout (CLS-safe). Swap the inner placeholder
 * for the actual <ins class="adsbygoogle"> unit + AdSense script once the
 * site has an approved AdSense account.
 */
export default function AdSlotPlaceholder({
  variant,
  className = "",
}: AdSlotPlaceholderProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <div
      className={`${config.minHeight} ${className} print:hidden flex items-center justify-center rounded-[var(--radius-card)] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60`}
      role="complementary"
      aria-label={config.label}
      data-ad-slot={variant}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {config.label} · {config.sizeHint}
      </span>
    </div>
  );
}
