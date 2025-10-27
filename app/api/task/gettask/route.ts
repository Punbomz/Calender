// app/api/task/gettask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

// GET - Fetch tasks
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isFinished = searchParams.get("isFinished");

    let tasksQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb
      .collection("users")
      .doc(userId)
      .collection("tasks");

    if (category) {
      tasksQuery = tasksQuery.where("category", "==", category);
    }

    if (isFinished !== null) {
      tasksQuery = tasksQuery.where("isFinished", "==", isFinished === "true");
    }

    const tasksSnapshot = await tasksQuery.get();

    const tasks = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    
    if (error.code === "auth/session-cookie-expired") {
      return NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';