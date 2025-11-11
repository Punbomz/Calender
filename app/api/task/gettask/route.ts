// app/api/task/gettask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

// Helper function to convert Firestore Timestamp to ISO string
function convertTimestamp(timestamp: any): string {
  if (!timestamp) return new Date().toISOString();
  
  // If it's already a string, return it
  if (typeof timestamp === 'string') return timestamp;
  
  // If it's a Firestore Timestamp with _seconds
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000).toISOString();
  }
  
  // If it has toDate method (Firestore Timestamp)
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  // Fallback
  return new Date().toISOString();
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

    const tasks = tasksSnapshot.docs.map((doc) => {
      const data = doc.data();
      
      return {
        id: doc.id,
        taskName: data.taskName || "",
        description: data.description || "",
        category: data.category || "S",
        priorityLevel: data.priorityLevel || 1,
        isFinished: data.isFinished || false,
        attachments: data.attachments || [],
        // Keep as Firestore timestamp object
        deadLine: data.deadLine || null,
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : null,
      };
    });

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