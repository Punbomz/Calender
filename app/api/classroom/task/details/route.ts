// app/api/classroom/task/details/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  try {
    // Verify user session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch (error) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid session" },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const classroomId = searchParams.get("classroomId");
    const taskId = searchParams.get("taskId");

    if (!classroomId || !taskId) {
      return NextResponse.json(
        { error: "Missing classroomId or taskId" },
        { status: 400 }
      );
    }

    console.log(`📋 Fetching task details: ${taskId} from classroom: ${classroomId}`);

    // Verify user has access to this classroom
    const classroomDoc = await adminDb.collection("classrooms").doc(classroomId).get();

    if (!classroomDoc.exists) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 }
      );
    }

    const classroomData = classroomDoc.data();
    const isTeacher = classroomData?.teacher === userId;
    const isStudent = (classroomData?.students as string[])?.includes(userId);

    if (!isTeacher && !isStudent) {
      return NextResponse.json(
        { error: "You don't have access to this classroom" },
        { status: 403 }
      );
    }

    // Get task details
    const taskDoc = await adminDb
      .collection("classrooms")
      .doc(classroomId)
      .collection("tasks")
      .doc(taskId)
      .get();

    if (!taskDoc.exists) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const taskData = taskDoc.data();

    console.log(`✅ Task details fetched successfully`);

    return NextResponse.json({
      success: true,
      task: {
        id: taskDoc.id,
        taskName: taskData?.taskName || "",
        description: taskData?.description || "",
        deadLine: taskData?.deadLine || "",
        category: taskData?.category || "Homework",
        createdAt: taskData?.createdAt || new Date().toISOString(),
        createdBy: taskData?.createdBy || "",
        files: taskData?.files || [],
      },
    });

  } catch (error) {
    console.error("❌ Error fetching task details:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';