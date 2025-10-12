import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { uid, displayName, photoURL } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing UID" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(uid);

    await userRef.set(
      {
        displayName: displayName || null,
        photoURL: photoURL || null,
        updatedAt: new Date(),
      },
      { merge: true } // ✅ Creates or updates the document
    );

    return NextResponse.json({ message: "User updated successfully!" });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

