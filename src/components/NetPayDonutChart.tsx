"use client";

interface NetPayDonutChartProps {
  /** Fraction (0–1) of gross pay that is take-home pay. */
  takeHomeFraction: number;
  netPayLabel: string;
  size?: number;
}

/**
 * A lightweight, dependency-free SVG donut chart showing take-home pay vs.
 * taxes & deductions as a proportion of gross pay. Purely presentational —
 * increases page dwell time and gives an instant visual read of the
 * breakdown alongside the exact dollar figures shown elsewhere on the card.
 */
export default function NetPayDonutChart({
  takeHomeFraction,
  netPayLabel,
  size = 128,
}: NetPayDonutChartProps) {
  const clamped = Math.max(0, Math.min(1, takeHomeFraction));
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const netDash = circumference * clamped;
  const center = size / 2;

  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${(clamped * 100).toFixed(1)}% of gross pay is take-home pay; the remainder is taxes and deductions`}
        className="shrink-0 -rotate-90"
      >
        {/* Track: taxes & deductions */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-800"
        />
        {/* Foreground arc: net pay */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={`${netDash} ${circumference - netDash}`}
          strokeLinecap="round"
          className="text-emerald-500 transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>

      <div>
        <p className="tabular-figure text-2xl font-semibold text-[var(--color-ink-900)]">
          {(clamped * 100).toFixed(1)}%
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          of gross pay is
        </p>
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          {netPayLabel}
        </p>
      </div>
    </div>
  );
}
