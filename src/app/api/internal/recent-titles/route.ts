import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

/** Recent post titles, so the automation service can avoid repeating topics. */
export async function GET(req: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const snap = await adminDb
    .collection("posts")
    .orderBy("createdAt", "desc")
    .limit(25)
    .select("title")
    .get();
  return NextResponse.json({ titles: snap.docs.map((d) => d.data().title ?? "") });
}
