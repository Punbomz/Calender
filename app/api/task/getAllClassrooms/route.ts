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

    // ✅ Fetch classroom details and count tasks created BY TEACHER
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
        
        // ✅ Check if current user is the teacher (createdBy field)
        const isTeacher = classData?.teacher === userId;
        
        let taskCount = 0;
        
        if (isTeacher) {
          // ✅ For teachers: Count tasks IN THE CLASSROOM collection
          // Tasks created by teacher are stored in classrooms/{classroomId}/tasks
          const classroomTasksSnapshot = await adminDb
            .collection("classrooms")
            .doc(classroomID)
            .collection("tasks")
            .get();
          
          taskCount = classroomTasksSnapshot.size;
          
          console.log(`📚 Teacher ${userId} has ${taskCount} tasks in classroom ${classroomID}`);
        } else {
          // ✅ For students: Count tasks in their personal tasks that reference this classroom
          const userTasksSnapshot = await adminDb
            .collection("users")
            .doc(userId)
            .collection("tasks")
            .where("classroom", "==", classroomID)
            .get();
          
          taskCount = userTasksSnapshot.size;
          
          console.log(`👨‍🎓 Student ${userId} has ${taskCount} tasks from classroom ${classroomID}`);
        }

        return {
          classroomID,
          name: classData?.name || classroomID,
          taskCount,
          isTeacher, // ✅ Add this field so frontend knows
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