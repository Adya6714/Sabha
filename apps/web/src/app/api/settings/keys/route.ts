import { NextResponse } from "next/server";
import {
  accountErrorResponse,
  loadAccount,
  saveAccountKeys,
} from "@/lib/account";

function fail(error: unknown) {
  const mapped = accountErrorResponse(error);
  console.error("settings keys", mapped.body.code);
  return NextResponse.json(mapped.body, { status: mapped.status });
}

export async function GET() {
  try {
    return NextResponse.json(await loadAccount());
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  let body: { openaiKey?: string | null; anthropicKey?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await saveAccountKeys({
        openaiKey: body.openaiKey,
        anthropicKey: body.anthropicKey,
      }),
    );
  } catch (error) {
    return fail(error);
  }
}
