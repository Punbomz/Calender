// app/api/classroom/sync-tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  const syncId = Math.random().toString(36).substring(7);
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔄 [SYNC ${syncId}] Starting classroom sync at ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    // Verify user session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      console.log(`❌ [SYNC ${syncId}] No session cookie found`);
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch (error) {
      console.log(`❌ [SYNC ${syncId}] Invalid session cookie`);
      return NextResponse.json(
        { error: "Unauthorized - Invalid session" },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    console.log(`✅ [SYNC ${syncId}] Authenticated user: ${userId}`);

    // Get user data to check role
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const userRole = userData?.role;

    console.log(`👤 [SYNC ${syncId}] User role: ${userRole}`);

    if (userRole !== "student") {
      console.log(`ℹ️ [SYNC ${syncId}] User is not a student, skipping sync`);
      return NextResponse.json({
        success: true,
        message: "Not a student, no sync needed",
        stats: {
          classroomsDeleted: 0,
          tasksDeleted: 0,
          tasksAdded: 0,
          tasksUpdated: 0,
          notifications: 0,
        },
      });
    }

    const userClassrooms = (userData?.classrooms as string[]) || [];
    console.log(`📚 [SYNC ${syncId}] User is in ${userClassrooms.length} classrooms:`, userClassrooms);

    let classroomsDeleted = 0;
    let tasksDeleted = 0;
    let tasksAdded = 0;
    let tasksUpdated = 0;
    let notifications = 0;

    // ========== STEP 1: Check if classrooms still exist ==========
    console.log(`\n📋 [SYNC ${syncId}] STEP 1: Validating classrooms...`);
    const validClassrooms: string[] = [];
    
    for (const classroomId of userClassrooms) {
      const classroomDoc = await adminDb.collection("classrooms").doc(classroomId).get();
      
      if (!classroomDoc.exists) {
        console.log(`❌ [SYNC ${syncId}] Classroom ${classroomId} no longer exists, removing...`);
        
        // Delete all tasks from this classroom
        const studentTasksRef = adminDb
          .collection("users")
          .doc(userId)
          .collection("tasks");
        
        const classroomTasksSnap = await studentTasksRef
          .where("classroom", "==", classroomId)
          .get();

        const deletionPromises = classroomTasksSnap.docs.map(doc => doc.ref.delete());
        await Promise.all(deletionPromises);
        
        tasksDeleted += classroomTasksSnap.size;
        classroomsDeleted++;
        
        console.log(`   🗑️ Deleted ${classroomTasksSnap.size} tasks from removed classroom`);
      } else {
        console.log(`✅ [SYNC ${syncId}] Classroom ${classroomId} exists`);
        validClassrooms.push(classroomId);
      }
    }

    // Update user's classroom list if any were removed
    if (classroomsDeleted > 0) {
      await adminDb.collection("users").doc(userId).update({
        classrooms: validClassrooms,
      });
      console.log(`✅ [SYNC ${syncId}] Updated user's classroom list (removed ${classroomsDeleted} classrooms)`);
    }

    // ========== STEP 2, 3 & 4: Sync tasks for valid classrooms ==========
    console.log(`\n📋 [SYNC ${syncId}] STEP 2, 3 & 4: Syncing tasks for ${validClassrooms.length} classrooms...`);
    
    for (const classroomId of validClassrooms) {
      console.log(`\n  🏫 [SYNC ${syncId}] Processing classroom: ${classroomId}`);
      
      // Get all tasks in the classroom
      const classroomTasksSnap = await adminDb
        .collection("classrooms")
        .doc(classroomId)
        .collection("tasks")
        .get();

      console.log(`     📊 Found ${classroomTasksSnap.size} tasks in classroom collection`);

      const classroomTaskIds = new Set<string>();
      const classroomTasksMap = new Map<string, any>();
      
      classroomTasksSnap.docs.forEach(doc => {
        const taskId = doc.id;
        const data = doc.data();
        
        console.log(`     📄 Task: ${taskId}`);
        console.log(`        - Name: ${data.taskName}`);
        console.log(`        - Deadline: ${data.deadLine}`);
        console.log(`        - Created: ${data.createdAt}`);
        
        classroomTaskIds.add(taskId);
        classroomTasksMap.set(taskId, { id: taskId, ...data });
      });

      console.log(`     ✅ Processed ${classroomTaskIds.size} classroom tasks`);

      // Get student's tasks for this classroom
      const studentTasksRef = adminDb
        .collection("users")
        .doc(userId)
        .collection("tasks");

      const studentClassroomTasksSnap = await studentTasksRef
        .where("classroom", "==", classroomId)
        .get();

      console.log(`     👤 Student has ${studentClassroomTasksSnap.size} tasks from this classroom`);

      const studentTaskMap = new Map<string, any>();
      studentClassroomTasksSnap.docs.forEach(doc => {
        const data = doc.data();
        const classroomTaskId = data.classroomTaskId;
        
        if (classroomTaskId) {
          console.log(`     👤 Student task: ${doc.id} -> classroomTaskId: ${classroomTaskId}`);
          studentTaskMap.set(classroomTaskId, { docId: doc.id, ...data });
        } else {
          console.log(`     ⚠️ Student task ${doc.id} has NO classroomTaskId!`);
        }
      });

      console.log(`     📊 Mapped ${studentTaskMap.size} student tasks with classroomTaskId`);

      // STEP 2: Delete tasks that no longer exist in classroom
      console.log(`\n     🗑️ Checking for tasks to delete...`);
      let deletedInClassroom = 0;
      for (const [classroomTaskId, studentTask] of studentTaskMap) {
        if (!classroomTaskIds.has(classroomTaskId)) {
          console.log(`        ❌ Deleting: ${classroomTaskId} (no longer in classroom)`);
          await studentTasksRef.doc(studentTask.docId).delete();
          tasksDeleted++;
          deletedInClassroom++;
        }
      }
      if (deletedInClassroom === 0) {
        console.log(`        ✅ No tasks to delete`);
      }

      // STEP 3: Add new tasks that student doesn't have yet
      console.log(`\n     ➕ Checking for new tasks to add...`);
      let addedInClassroom = 0;
      
      // STEP 4: Update existing tasks with changes
      console.log(`\n     🔄 Checking for tasks to update...`);
      let updatedInClassroom = 0;
      
      for (const [classroomTaskId, classroomTask] of classroomTasksMap) {
        if (!studentTaskMap.has(classroomTaskId)) {
          // NEW TASK - Add it
          console.log(`        ➕ NEW TASK FOUND: ${classroomTask.taskName}`);
          console.log(`           Task ID: ${classroomTaskId}`);
          console.log(`           Deadline: ${classroomTask.deadLine}`);
          
          const newTaskData = {
            taskName: classroomTask.taskName,
            description: classroomTask.description || "",
            deadLine: classroomTask.deadLine,
            category: classroomTask.category || "Homework",
            priorityLevel: 3,
            classroom: classroomId,
            classroomTaskId: classroomTaskId,
            isFinished: false,
            createdAt: classroomTask.createdAt || new Date().toISOString(),
            attachments: classroomTask.files || [],
          };
          
          const addedTaskRef = await studentTasksRef.add(newTaskData);
          console.log(`           ✅ Added with doc ID: ${addedTaskRef.id}`);

          tasksAdded++;
          notifications++;
          addedInClassroom++;
        } else {
          // EXISTING TASK - Check for updates
          const studentTask = studentTaskMap.get(classroomTaskId);
          const changes: string[] = [];
          const updateData: any = {};
          
          // Compare task name
          if (classroomTask.taskName !== studentTask.taskName) {
            changes.push(`name: "${studentTask.taskName}" → "${classroomTask.taskName}"`);
            updateData.taskName = classroomTask.taskName;
          }
          
          // Compare description
          const classroomDesc = classroomTask.description || "";
          const studentDesc = studentTask.description || "";
          if (classroomDesc !== studentDesc) {
            changes.push(`description changed`);
            updateData.description = classroomDesc;
          }
          
          // Compare deadline
          if (classroomTask.deadLine !== studentTask.deadLine) {
            changes.push(`deadline: ${studentTask.deadLine} → ${classroomTask.deadLine}`);
            updateData.deadLine = classroomTask.deadLine;
          }
          
          // Compare category
          const classroomCategory = classroomTask.category || "Homework";
          const studentCategory = studentTask.category || "Homework";
          if (classroomCategory !== studentCategory) {
            changes.push(`category: ${studentCategory} → ${classroomCategory}`);
            updateData.category = classroomCategory;
          }
          
          // Compare files/attachments
          const classroomFiles = JSON.stringify(classroomTask.files || []);
          const studentFiles = JSON.stringify(studentTask.attachments || []);
          if (classroomFiles !== studentFiles) {
            const classroomFileCount = (classroomTask.files || []).length;
            const studentFileCount = (studentTask.attachments || []).length;
            changes.push(`files: ${studentFileCount} → ${classroomFileCount}`);
            updateData.attachments = classroomTask.files || [];
          }
          
          // If there are changes, update the student's task
          if (changes.length > 0) {
            console.log(`        🔄 UPDATING TASK: ${classroomTask.taskName}`);
            console.log(`           Student Doc ID: ${studentTask.docId}`);
            console.log(`           Changes detected:`);
            changes.forEach(change => console.log(`              - ${change}`));
            
            await studentTasksRef.doc(studentTask.docId).update(updateData);
            
            tasksUpdated++;
            updatedInClassroom++;
            console.log(`           ✅ Task updated successfully`);
          }
        }
      }
      
      if (addedInClassroom === 0) {
        console.log(`        ✅ No new tasks to add (student is up to date)`);
      } else {
        console.log(`        🎉 Added ${addedInClassroom} new tasks!`);
      }
      
      if (updatedInClassroom === 0) {
        console.log(`        ✅ No tasks need updating (all are current)`);
      } else {
        console.log(`        🔄 Updated ${updatedInClassroom} existing tasks!`);
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ [SYNC ${syncId}] Sync complete!`);
    console.log(`   📊 Final Stats:`);
    console.log(`      - Classrooms removed: ${classroomsDeleted}`);
    console.log(`      - Tasks deleted: ${tasksDeleted}`);
    console.log(`      - Tasks added: ${tasksAdded}`);
    console.log(`      - Tasks updated: ${tasksUpdated}`);
    console.log(`      - Notifications: ${notifications}`);
    console.log(`${'='.repeat(80)}\n`);

    return NextResponse.json({
      success: true,
      message: "Classroom tasks synced successfully",
      stats: {
        classroomsDeleted,
        tasksDeleted,
        tasksAdded,
        tasksUpdated,
        notifications,
      },
    });

  } catch (error) {
    console.error(`❌ [SYNC ${syncId}] Error syncing classroom tasks:`, error);
    console.error(`   Stack:`, error instanceof Error ? error.stack : "No stack");
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