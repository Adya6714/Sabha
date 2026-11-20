import { NextResponse } from "next/server";
import {
  forwardWaitlist,
  isValidEmail,
  normalizeEmail,
  rememberLocally,
} from "@/lib/waitlist";

export async function POST(request: Request) {
  let body: { email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = normalizeEmail(body.email || "");
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const entry = {
    email,
    source: body.source || "unknown",
    createdAt: new Date().toISOString(),
  };

  try {
    const { forwarded } = await forwardWaitlist(entry);
    if (!forwarded) rememberLocally(email);

    return NextResponse.json({
      ok: true,
      message:
        "You're on the early access list. We'll write when a seat opens.",
      forwarded,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not save your email right now. Please try again." },
      { status: 502 },
    );
  }
}
