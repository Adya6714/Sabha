import { NextResponse } from "next/server";
import {
  accountErrorResponse,
  authenticateGatewayRequest,
} from "@/lib/account";

export async function POST(request: Request) {
  try {
    const result = await authenticateGatewayRequest(
      request.headers.get("authorization"),
    );
    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            "Send Authorization: Bearer sabha_… using the key from Settings.",
        },
        { status: 401 },
      );
    }
    return NextResponse.json({ ok: true, auth: "api_key" });
  } catch (error) {
    const mapped = accountErrorResponse(error);
    console.error("gateway auth", mapped.body.code);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
