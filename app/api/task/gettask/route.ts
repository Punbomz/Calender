// app/api/task/gettask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

// Helper function to ensure timestamp is in correct format
function normalizeTimestamp(timestamp: any): { _seconds: number; _nanoseconds: number } {
  if (!timestamp) {
    const now = Date.now();
    return {
      _seconds: Math.floor(now / 1000),
      _nanoseconds: (now % 1000) * 1000000
    };
  }
  
  // If it's already in the correct format
  if (timestamp._seconds !== undefined) {
    return {
      _seconds: timestamp._seconds,
      _nanoseconds: timestamp._nanoseconds || 0
    };
  }
  
  // If it has toDate method (Firestore Timestamp)
  if (typeof timestamp.toDate === 'function') {
    const date = timestamp.toDate();
    const ms = date.getTime();
    return {
      _seconds: Math.floor(ms / 1000),
      _nanoseconds: (ms % 1000) * 1000000
    };
  }
  
  // If it's a string
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    const ms = date.getTime();
    return {
      _seconds: Math.floor(ms / 1000),
      _nanoseconds: (ms % 1000) * 1000000
    };
  }
  
  // Fallback
  const now = Date.now();
  return {
    _seconds: Math.floor(now / 1000),
    _nanoseconds: (now % 1000) * 1000000
  };
}

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

    console.log('🔥 Fetching tasks for user:', userId);
    console.log('📊 Filters:', { category, isFinished });

    let tasksQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb
      .collection("users")
      .doc(userId)
      .collection("tasks");

    if (category) {
      tasksQuery = tasksQuery.where("category", "==", category);
    }

    if (isFinished !== null && isFinished !== undefined) {
      const isFinishedBool = isFinished === "true";
      console.log('🔍 Filtering by isFinished:', isFinishedBool);
      tasksQuery = tasksQuery.where("isFinished", "==", isFinishedBool);
    }

    const tasksSnapshot = await tasksQuery.get();

    const tasks = tasksSnapshot.docs.map((doc) => {
      const data = doc.data();
      
      // ✅ Include classroom field if it exists
      return {
        id: doc.id,
        taskName: data.taskName || "",
        description: data.description || "",
        category: data.category || "S",
        classroom: data.classroom || null, // ✅ Add classroom field
        priorityLevel: data.priorityLevel || 1,
        isFinished: data.isFinished || false,
        attachments: data.attachments || [],
        deadLine: normalizeTimestamp(data.deadLine),
        createdAt: normalizeTimestamp(data.createdAt),
        updatedAt: data.updatedAt ? normalizeTimestamp(data.updatedAt) : null,
      };
    });

    console.log(`✅ Found ${tasks.length} tasks`);
    console.log('📚 Sample task with classroom:', tasks.slice(0, 2).map(t => ({
      name: t.taskName,
      category: t.category,
      classroom: t.classroom
    })));

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error: any) {
    console.error("❌ Error fetching tasks:", error);
    
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