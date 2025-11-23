// app/api/classroom/info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  try {
    // Get classroom ID from query params
    const searchParams = request.nextUrl.searchParams;
    const classroomId = searchParams.get("id");

    if (!classroomId) {
      return NextResponse.json(
        { error: "Classroom ID is required" },
        { status: 400 }
      );
    }

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

    // ---------- 1) Fetch classroom data ----------
    const classroomRef = adminDb.collection("classrooms").doc(classroomId);
    const classroomSnap = await classroomRef.get();

    if (!classroomSnap.exists) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 }
      );
    }

    const classroomData = classroomSnap.data();
    const classroom = {
      id: classroomSnap.id,
      name: classroomData?.name || "",
      code: classroomData?.code || "",
      teacher: classroomData?.teacher || "",
    };

    // ---------- 2) Fetch teacher name ----------
    let teacherName = "Unknown Teacher";
    const teacherUid = classroomData?.teacher;

    if (teacherUid) {
      try {
        const teacherRef = adminDb.collection("users").doc(teacherUid);
        const teacherSnap = await teacherRef.get();

        if (teacherSnap.exists) {
          const teacherData = teacherSnap.data();
          teacherName = teacherData?.displayName || teacherData?.email || "Unknown Teacher";
        }
      } catch (err) {
        console.error("Error fetching teacher info:", err);
      }
    }

    // ---------- 3) Fetch tasks from subcollection ----------
    const tasksCol = classroomRef.collection("tasks");
    const tasksSnap = await tasksCol.get();
    const tasks = tasksSnap.docs
      .map((doc) => doc.data().name as string)
      .filter(Boolean);

    // ---------- 4) Fetch students ----------
    const studentsArray = (classroomData?.students as string[]) || [];
    const students: string[] = [];

    if (studentsArray.length > 0) {
      // Fetch student names from users collection
      const studentPromises = studentsArray.map(async (studentUid: string) => {
        try {
          const userRef = adminDb.collection("users").doc(studentUid);
          const userSnap = await userRef.get();

          if (userSnap.exists) {
            const userData = userSnap.data();
            return userData?.displayName || userData?.email || studentUid;
          }
          return studentUid;
        } catch (err) {
          console.error("Error fetching student info:", err);
          return studentUid;
        }
      });

      const studentNames = await Promise.all(studentPromises);
      students.push(...studentNames.filter(Boolean));
    } else {
      // Fallback: try subcollection
      const studentsCol = classroomRef.collection("students");
      const studentsSnap = await studentsCol.get();

      if (studentsSnap.size > 0) {
        const studentPromises = studentsSnap.docs.map(async (studentDoc) => {
          const studentData = studentDoc.data();
          const studentUid = studentData.userId || studentData.uid || studentDoc.id;

          try {
            const userRef = adminDb.collection("users").doc(studentUid);
            const userSnap = await userRef.get();

            if (userSnap.exists) {
              const userData = userSnap.data();
              return userData?.displayName || userData?.email || studentUid;
            }
          } catch (err) {
            console.error("Error fetching student info:", err);
          }

          return studentData.name || studentData.displayName || studentUid;
        });

        const studentNames = await Promise.all(studentPromises);
        students.push(...studentNames.filter(Boolean));
      }
    }

    // ---------- 5) Get current user's role ----------
    let userRole = "";
    try {
      const currentUserRef = adminDb.collection("users").doc(userId);
      const currentUserSnap = await currentUserRef.get();

      if (currentUserSnap.exists) {
        const userData = currentUserSnap.data();
        userRole = userData?.role || "";
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
    }

    return NextResponse.json({
      classroom,
      teacherName,
      tasks,
      students,
      userRole,
    });
  } catch (error) {
    console.error("Error in classroom info API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}