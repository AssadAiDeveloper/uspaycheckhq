import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PaycheckCalculator from "@/components/PaycheckCalculator";
import StateInfoSection, { buildStateFaqs } from "@/components/StateInfoSection";
import AdSlotPlaceholder from "@/components/AdSlotPlaceholder";
import StatesGrid from "@/components/StatesGrid";
import { getStateMetadata } from "@/lib/engine/state";
import { getAllStateSlugs, slugToStateCode } from "@/lib/utils/slug";

interface StatePageProps {
  params: Promise<{ state: string }>;
}

// Static Site Generation: pre-render all 51 state routes at build time for
// sub-second LCP (no per-request data fetching needed — everything is local JSON).
export function generateStaticParams() {
  return getAllStateSlugs().map((slug) => ({ state: slug }));
}

export async function generateMetadata({
  params,
}: StatePageProps): Promise<Metadata> {
  const { state: slug } = await params;
  const stateCode = slugToStateCode(slug);
  if (!stateCode) return {};

  const state = getStateMetadata(stateCode);
  const title = `${state.name} Paycheck Calculator 2026 — Salary & Hourly Tax Calculator`;
  const description = state.hasIncomeTax
    ? `Free ${state.name} paycheck calculator for 2026. Estimate salary and hourly take-home pay after federal tax, ${state.name} state tax brackets, and FICA — with a full 2026 tax table and FAQ.`
    : `Free ${state.name} paycheck calculator for 2026. ${state.name} has no state income tax — estimate salary and hourly take-home pay after federal tax and FICA withholding.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { state: slug } = await params;
  const stateCode = slugToStateCode(slug);
  if (!stateCode) notFound();

  const state = getStateMetadata(stateCode);
  const faqs = buildStateFaqs(stateCode);

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${state.name} Paycheck Calculator`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any (Web-based)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: `https://uspaycheckhq.com/${slug}`,
  };

  const financialProductSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: `${state.name} Payroll Tax Estimate`,
    description: `Estimated federal, ${state.name} state, and FICA payroll withholding for 2026.`,
    provider: {
      "@type": "Organization",
      name: "USPaycheckHQ",
    },
    areaServed: {
      "@type": "State",
      name: state.name,
    },
  };

  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* JSON-LD structured data for pSEO indexing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(financialProductSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />

      <nav aria-label="Breadcrumb" className="print:hidden mb-4 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Calculator
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-700 dark:text-slate-300">{state.name}</span>
      </nav>

      <h1 className="print:hidden mb-1 text-xl font-semibold text-[var(--color-ink-900)]">
        {state.name} Paycheck Calculator
      </h1>
      <p className="print:hidden mb-6 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
        Estimate your {state.name} take-home pay for 2026, including federal
        tax, FICA, and {state.hasIncomeTax ? "state" : "any applicable"}{" "}
        withholding.
      </p>

      <PaycheckCalculator key={stateCode} defaultStateCode={stateCode} />

      <div className="print:hidden mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <StateInfoSection stateCode={stateCode} />
        <div className="hidden lg:block">
          <AdSlotPlaceholder variant="sidebar" className="lg:sticky lg:top-20" />
        </div>
      </div>

      <section className="print:hidden mt-10">
        <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
          Compare with another state
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Paycheck calculators for all 50 states + DC.
        </p>
        <div className="mt-4">
          <StatesGrid excludeCode={stateCode} />
        </div>
      </section>

      <div className="mt-8">
        <AdSlotPlaceholder variant="bottom-banner" />
      </div>
    </div>
  );
}
