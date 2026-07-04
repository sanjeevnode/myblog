import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

/** Lets myblog-automation drop an in-app notification (e.g. LinkedIn publish failed). */
export async function POST(req: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { recipientId?: string; message?: string; postId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.recipientId || !body.message) {
    return NextResponse.json({ error: "recipientId and message required" }, { status: 400 });
  }

  await adminDb.collection("notifications").add({
    recipientId: body.recipientId,
    type: "automation",
    actorName: "Automation",
    message: body.message,
    postId: body.postId ?? null,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
