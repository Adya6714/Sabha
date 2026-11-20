import { NextResponse } from "next/server";
import { accountErrorResponse, issueAccountGatewayKey } from "@/lib/account";

export async function POST() {
  try {
    return NextResponse.json(await issueAccountGatewayKey());
  } catch (error) {
    const mapped = accountErrorResponse(error);
    console.error("gateway key", mapped.body.code);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
