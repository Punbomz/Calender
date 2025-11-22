// app/api/task/getAllClassrooms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    // ✅ Read session cookie
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // ✅ Verify session and get uid
    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    const userId = decodedToken.uid;

    // ✅ Get user's classrooms
    const userClassesSnapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection("classrooms")
      .get();

    if (userClassesSnapshot.empty) {
      return NextResponse.json({
        success: true,
        count: 0,
        classrooms: [],
      });
    }

    // ✅ Get all user tasks to count classroom tasks
    const tasksSnapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection("tasks")
      .get();

    const allTasks = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // ✅ Fetch classroom details and count tasks
    const classroomPromises = userClassesSnapshot.docs.map(async (classDoc) => {
      const classroomID = classDoc.id;
      
      try {
        const classSnapshot = await adminDb
          .collection("classrooms")
          .doc(classroomID)
          .get();

        if (!classSnapshot.exists) {
          console.log(`Classroom ${classroomID} not found in main collection`);
          return null;
        }

        const classData = classSnapshot.data();
        
        // Count tasks for this classroom
        const taskCount = allTasks.filter(
          (task: any) => task.classroom === classroomID
        ).length;

        return {
          classroomID,
          name: classData?.name || classroomID,
          taskCount,
        };
      } catch (error) {
        console.error(`Error fetching classroom ${classroomID}:`, error);
        return null;
      }
    });

    const results = await Promise.all(classroomPromises);
    const classrooms = results.filter((c) => c !== null);

    console.log(`✅ Found ${classrooms.length} classrooms for user ${userId}`);

    return NextResponse.json({
      success: true,
      count: classrooms.length,
      classrooms,
    });
  } catch (error: any) {
    console.error("❌ Error fetching classrooms:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch classrooms",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";