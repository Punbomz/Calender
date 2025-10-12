import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// ✅ ดึงข้อมูล user ตาม uid
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    if (!uid) return NextResponse.json({ error: "Missing UID" }, { status: 400 });

    const doc = await adminDb.collection("users").doc(uid).get();
    if (!doc.exists) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(doc.data());
  } catch (error: any) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ อัปเดตข้อมูล user
export async function POST(req: Request) {
  try {
    const { uid, displayName, fullname, photoURL } = await req.json();
    if (!uid)
      return NextResponse.json({ error: "Missing UID" }, { status: 400 });

    const userRef = adminDb.collection("users").doc(uid);
    await userRef.set(
      {
        displayName: displayName ?? null,
        fullname: fullname ?? null,
        photoURL: photoURL ?? null,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ message: "User updated successfully!" });
  } catch (error: any) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


