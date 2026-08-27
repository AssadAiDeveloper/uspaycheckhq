"use client";

import { Download } from "lucide-react";

/**
 * Triggers the browser's native print dialog (every modern browser offers
 * "Save as PDF" as a print destination) scoped to a print-only stylesheet
 * that hides site chrome and formats a clean, professional one-page
 * summary. This keeps the "no data ever leaves your browser" privacy
 * promise intact — nothing is uploaded to generate the file.
 */
export default function DownloadResultsButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 hover:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
    >
      <Download className="h-4 w-4" aria-hidden />
      Download results (PDF)
    </button>
  );
}
