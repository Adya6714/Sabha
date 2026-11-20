import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MotifRule } from "@/components/CarpetFrame";
import { KeysForm } from "./KeysForm";

export const metadata: Metadata = {
  title: "Your keys",
  description:
    "Add your own OpenAI and Anthropic keys. Sabha stops model calls before ₹100 combined.",
};

export default function SettingsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="eyebrow">Early access</p>
        <h1 className="mt-3 font-serif text-4xl font-medium text-ink">
          Your model keys
        </h1>
        <p className="mt-4 max-w-2xl text-ink2">
          Sabha does not ship with a shared model key. Each person adds their
          own OpenAI and Anthropic keys. Spend on both is combined, and model
          calls stop before ₹100. After that they stay blocked.
        </p>
        <MotifRule className="mt-8 opacity-55" />
        <KeysForm />
      </main>
      <SiteFooter />
    </>
  );
}
