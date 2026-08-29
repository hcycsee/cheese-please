import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { suggestFreeSlotsFromIcs } from "@/lib/ics";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const icsText = typeof body?.icsText === "string" ? body.icsText : "";
  if (!icsText) return NextResponse.json({ error: "No calendar file content provided." }, { status: 400 });
  if (Buffer.byteLength(icsText, "utf8") > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "That calendar file is too large." }, { status: 413 });
  }

  const suggestedSlots = suggestFreeSlotsFromIcs(icsText);
  return NextResponse.json({ suggestedSlots });
}
