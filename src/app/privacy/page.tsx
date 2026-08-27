import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "USPaycheckHQ's privacy policy: what data we collect, how Google AdSense uses cookies, and your rights under GDPR and CCPA.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-[var(--color-ink-900)]">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Effective date: January 1, 2026 · Last reviewed: August 2026
      </p>

      <div className="mt-8 space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Overview
          </h2>
          <p className="mt-3">
            This policy explains what information USPaycheckHQ
            (&quot;we,&quot; &quot;us&quot;) collects when you use this
            website, how it is used, and the choices available to you. We
            built this calculator to work without collecting the financial
            information you enter — the details below explain exactly what
            that means in practice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Paycheck data you enter
          </h2>
          <p className="mt-3">
            Gross pay, filing status, state, and deduction amounts you type
            into the calculator are processed{" "}
            <strong>entirely in your browser</strong>. This data is never
            sent to, or stored on, our servers. Closing or refreshing the
            page clears it. We have no way to see, recover, or be asked to
            delete calculator inputs, because we never receive them.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Information collected automatically
          </h2>
          <p className="mt-3">
            Like most websites, our hosting provider and analytics tools
            automatically log standard technical information when you visit:
            IP address, browser type, device type, pages viewed, referring
            URL, and timestamps. This is used in aggregate to understand
            site traffic and is not linked to any paycheck data you enter.
          </p>
          <p className="mt-3">
            We use <strong>Google Analytics</strong> to understand aggregate
            site traffic and usage patterns. Google Analytics sets its own
            cookies to distinguish visitors and sessions; it does not have
            access to any paycheck figures you enter into the calculator. You
            can opt out of Google Analytics tracking across all websites by
            installing the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Google Analytics Opt-out Browser Add-on
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Cookies and advertising (Google AdSense)
          </h2>
          <p className="mt-3">
            This site displays advertisements served by Google AdSense.
            Google and its advertising partners use cookies — including the
            DoubleClick cookie — to serve ads based on your prior visits to
            this site and other sites on the internet.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Google&apos;s use of advertising cookies enables it and its
              partners to serve ads based on your visits to this site and/or
              other sites.
            </li>
            <li>
              You may opt out of personalized advertising by visiting{" "}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Google Ads Settings
              </a>
              .
            </li>
            <li>
              You can also opt out of some third-party vendors&apos; use of
              cookies for personalized advertising by visiting{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                www.aboutads.info/choices
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Your rights under GDPR (EEA / UK visitors)
          </h2>
          <p className="mt-3">
            If you are located in the European Economic Area or the United
            Kingdom, you have the right to access, correct, delete, or
            restrict processing of personal data we hold about you, and the
            right to data portability and to object to processing. Because
            we do not collect account or paycheck data tied to your
            identity, most requests will relate to cookie-based advertising
            data, which is controlled by Google as described above. To
            exercise these rights regarding site analytics, contact us using
            the details below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Your rights under CCPA/CPRA (California visitors)
          </h2>
          <p className="mt-3">
            California residents have the right to know what personal
            information is collected, to request deletion of personal
            information, and to opt out of the &quot;sale&quot; or
            &quot;sharing&quot; of personal information (as those terms are
            defined under California law), which can include the use of
            advertising cookies for cross-context behavioral advertising. You
            can exercise your opt-out choice using the Google Ads Settings
            and aboutads.info links above, or by enabling the Global Privacy
            Control signal in a supporting browser.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Children&apos;s privacy
          </h2>
          <p className="mt-3">
            This site is not directed at children under 13, and we do not
            knowingly collect personal information from children.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Changes to this policy
          </h2>
          <p className="mt-3">
            We may update this policy from time to time. Material changes
            will be reflected by updating the &quot;last reviewed&quot; date
            at the top of this page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Contact
          </h2>
          <p className="mt-3">
            Questions about this policy or requests regarding your data can
            be sent to the contact address listed on our{" "}
            <Link
              href="/about"
              className="text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              About page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
