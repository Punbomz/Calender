// /api/task/deleteCategory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    const userId = decodedToken.uid;

    const { categoryName } = await req.json();

    if (!categoryName) {
      return NextResponse.json(
        { error: "Missing categoryName" },
        { status: 400 }
      );
    }

    // ใช้ adminDb (Admin SDK) แทน client db
    const docRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("category")
      .doc(categoryName);

    await docRef.delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete category failed:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
