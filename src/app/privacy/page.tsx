import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Sabha handles early-access emails and demo data.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-serif text-4xl text-ink">Privacy</h1>
        <p className="mt-4 text-ink2">Last updated 2026-11-10</p>

        <div className="prose-sabha mt-10 space-y-6 text-[15.5px] leading-relaxed text-ink2">
          <p>
            Sabha’s interactive demo runs in your browser with simulated agent
            data. Decisions you make in the demo stay on your device unless you
            export them yourself.
          </p>
          <p>
            If you join the early access waitlist, we collect the email address
            you submit and when you submitted it. We use that only to contact
            you about Sabha access and product updates. We do not sell waitlist
            emails.
          </p>
          <p>
            Optional analytics or email tooling may be added later; this page
            will be updated before that happens. Questions: open an issue on{" "}
            <a
              className="text-maroon underline-offset-2 hover:underline"
              href="https://github.com/Adya6714/Sabha"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
