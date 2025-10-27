// app/api/task/create-random/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { Timestamp } from "firebase-admin/firestore";

// Sample data for generating random tasks
const taskNames = [
  "Complete project proposal",
  "Review code changes",
  "Update documentation",
  "Fix bug in authentication",
  "Design new feature",
  "Write unit tests",
  "Refactor database queries",
  "Meeting with client",
  "Deploy to production",
  "Update dependencies",
  "Create presentation slides",
  "Research new technologies",
  "Optimize performance",
  "Security audit",
  "User testing session",
];

const descriptions = [
  "Need to finish this before the deadline",
  "High priority task that requires immediate attention",
  "Regular maintenance work",
  "Important milestone for the project",
  "Quick task that should be done today",
  "Long-term goal that needs planning",
  "Collaborative effort with the team",
  "Critical bug that affects users",
  "Enhancement requested by stakeholders",
  "Routine check-up and updates",
];

const categories = [
  "Work",
  "Personal",
  "Shopping",
  "Health",
  "Finance",
  "Education",
  "Home",
  "Social",
];

// Helper function to generate random date
const getRandomDate = (start: Date, end: Date) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// POST - Create random tasks for testing
export async function POST(request: NextRequest) {
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

    // Get count from request body (default to 5)
    const body = await request.json().catch(() => ({}));
    const count = body.count || 5;

    if (count > 50) {
      return NextResponse.json(
        { error: "Cannot create more than 50 tasks at once" },
        { status: 400 }
      );
    }

    const createdTasks = [];
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days in the future

    for (let i = 0; i < count; i++) {
      // Generate random task data
      const randomTaskName =
        taskNames[Math.floor(Math.random() * taskNames.length)];
      const randomDescription =
        descriptions[Math.floor(Math.random() * descriptions.length)];
      const randomCategory =
        categories[Math.floor(Math.random() * categories.length)];
      const randomPriority = Math.floor(Math.random() * 4); // 0-3
      const randomIsFinished = Math.random() > 0.7; // 30% chance of being finished
      const randomDeadline = getRandomDate(now, futureDate);

      const taskData = {
        taskName: `${randomTaskName} #${i + 1}`,
        description: randomDescription,
        category: randomCategory,
        priorityLevel: randomPriority,
        isFinished: randomIsFinished,
        createdAt: Timestamp.now(),
        deadLine: Timestamp.fromDate(randomDeadline),
      };

      // Add task to Firestore
      const taskRef = await adminDb
        .collection("users")
        .doc(userId)
        .collection("tasks")
        .add(taskData);

      createdTasks.push({
        id: taskRef.id,
        ...taskData,
        createdAt: taskData.createdAt.toDate().toISOString(),
        deadLine: taskData.deadLine.toDate().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${count} random tasks`,
      tasks: createdTasks,
      count: createdTasks.length,
    });
  } catch (error: any) {
    console.error("Error creating random tasks:", error);

    if (error.code === "auth/session-cookie-expired") {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to create random tasks", details: error.message },
      { status: 500 }
    );
  }
}

// Optional: DELETE endpoint to clear all tasks (useful for testing)
export async function DELETE(request: NextRequest) {
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

    // Get all tasks
    const tasksSnapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection("tasks")
      .get();

    // Delete all tasks
    const batch = adminDb.batch();
    tasksSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Deleted ${tasksSnapshot.size} tasks`,
      count: tasksSnapshot.size,
    });
  } catch (error: any) {
    console.error("Error deleting tasks:", error);

    if (error.code === "auth/session-cookie-expired") {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to delete tasks", details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";