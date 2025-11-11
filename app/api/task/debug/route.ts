// app/api/task/debug/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    console.log("Session exists:", !!session);

    if (!session) {
      return NextResponse.json(
        { error: "No session found", hasSession: false },
        { status: 401 }
      );
    }

    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    const userId = decodedToken.uid;

    console.log("User ID:", userId);

    // ลอง query ทั้งหมดก่อน
    const tasksRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("tasks");

    const snapshot = await tasksRef.get();

    console.log("Total tasks found:", snapshot.size);

    const allTasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("All tasks:", allTasks);

    // ลอง query เฉพาะ isFinished=false
    const unfinishedSnapshot = await tasksRef
      .where("isFinished", "==", false)
      .get();

    const unfinishedTasks = unfinishedSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      userId,
      hasSession: true,
      totalTasks: snapshot.size,
      unfinishedCount: unfinishedSnapshot.size,
      allTasks,
      unfinishedTasks,
    });
  } catch (error: any) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';