// /api/task/deleteCategory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function DELETE(req: Request) {
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

    const { categoryName } = await req.json();

    if (!categoryName) {
      return NextResponse.json(
        { error: "Missing categoryName" },
        { status: 400 }
      );
    }

    // ✅ Step 1: Get all tasks with this category
    const tasksRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("tasks");

    const tasksSnapshot = await tasksRef
      .where("category", "==", categoryName)
      .get();

    // ✅ Step 2: Update all matching tasks to set category to ""
    const batch = adminDb.batch();
    let updatedTasksCount = 0;

    tasksSnapshot.forEach((doc) => {
      batch.update(doc.ref, { category: "" });
      updatedTasksCount++;
    });

    // Commit the batch update
    if (updatedTasksCount > 0) {
      await batch.commit();
      console.log(`✅ Updated ${updatedTasksCount} tasks to have empty category`);
    }

    // ✅ Step 3: Delete the category
    const categoryRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("category")
      .doc(categoryName);

    await categoryRef.delete();

    return NextResponse.json({ 
      success: true,
      message: "Category deleted successfully",
      updatedTasksCount 
    });
  } catch (error) {
    console.error("❌ Delete category failed:", error);
    return NextResponse.json({ 
      success: false,
      error: "Delete failed" 
    }, { status: 500 });
  }
}