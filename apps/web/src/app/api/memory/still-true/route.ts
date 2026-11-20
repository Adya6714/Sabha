import { NextResponse } from "next/server";

/**
 * Placeholder — wires to `@sabha/ledger` `review()` when DATABASE_URL is set.
 * USER ACTION: ensure DATABASE_URL in deployment env to persist confirmations.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.redirect(
      new URL("/memory?notice=local-only", request.url),
    );
  }

  try {
    const { review } = await import("@sabha/ledger");
    await review(id);
  } catch {
    return NextResponse.redirect(
      new URL("/memory?notice=review-failed", request.url),
    );
  }

  return NextResponse.redirect(new URL("/memory?notice=confirmed", request.url));
}
