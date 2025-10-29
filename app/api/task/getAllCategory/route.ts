// app/api/task/getcategory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    // ✅ อ่าน session cookie
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // ✅ ตรวจสอบ session และดึง uid
    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    const userId = decodedToken.uid;

    // ✅ ดึง category ของ user คนนี้
    const snapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection("category")
      .get();

    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
