import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    // ✅ อ่าน session cookie
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // ✅ verify session cookie เพื่อเอา uid
    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    const userId = decodedToken.uid;

    // ✅ อ่านข้อมูลจาก body
    const { tagName } = await req.json();

    if (!tagName) {
      return NextResponse.json(
        { error: "Missing tagName" },
        { status: 400 }
      );
    }

    // ✅ path: users/{userId}/category/{tagName}
    const tagRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("category")
      .doc(tagName);

    await tagRef.set({
      categoryName: tagName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, tagName }, { status: 200 });
  } catch (err) {
    console.error("Tag creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}
