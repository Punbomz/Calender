import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

// Helper function to normalize timestamp
function normalizeTimestamp(timestamp: any): string {
  if (!timestamp) {
    return new Date().toISOString();
  }
  
  // If it's already in the correct format with _seconds
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000).toISOString();
  }
  
  // If it has toDate method (Firestore Timestamp)
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  // If it's a string
  if (typeof timestamp === 'string') {
    return new Date(timestamp).toISOString();
  }
  
  // Fallback
  return new Date().toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    // Get taskId from query parameters
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Verify session and get user ID
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    console.log('📋 Fetching task details:', { userId, taskId });

    // Fetch the task document from user's tasks collection
    const taskRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('tasks')
      .doc(taskId);

    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const taskData = taskDoc.data();

    if (!taskData) {
      return NextResponse.json(
        { error: 'Task data is empty' },
        { status: 404 }
      );
    }

    console.log('✅ Task found:', taskData.taskName);
    console.log('🏫 Has classroom:', taskData.classroom || 'No');

    // Fetch creator's display name
    let createdByName = 'Unknown';
    let teacherId = null;

    // If task has classroom, fetch teacher from classroom document
    if (taskData.classroom) {
      try {
        const classroomRef = adminDb.collection('classrooms').doc(taskData.classroom);
        const classroomSnap = await classroomRef.get();

        if (classroomSnap.exists) {
          const classroomData = classroomSnap.data();
          teacherId = classroomData?.teacher;
          
          console.log('👨‍🏫 Teacher ID from classroom:', teacherId);

          // Fetch teacher's name
          if (teacherId) {
            const teacherRef = adminDb.collection('users').doc(teacherId);
            const teacherSnap = await teacherRef.get();

            if (teacherSnap.exists) {
              const teacherData = teacherSnap.data();
              createdByName = teacherData?.displayName || teacherData?.email || 'Unknown Teacher';
              console.log('✅ Teacher name:', createdByName);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching classroom/teacher info:', err);
      }
    } else if (taskData.createdBy) {
      // Fallback: if task has createdBy field but no classroom
      teacherId = taskData.createdBy;
      try {
        const creatorRef = adminDb.collection('users').doc(teacherId);
        const creatorSnap = await creatorRef.get();

        if (creatorSnap.exists) {
          const creatorData = creatorSnap.data();
          createdByName = creatorData?.displayName || creatorData?.email || 'Unknown';
        }
      } catch (err) {
        console.error('Error fetching creator info:', err);
      }
    }

    // Format the task data
    const formattedTask = {
      id: taskDoc.id,
      taskName: taskData.taskName || '',
      description: taskData.description || '',
      category: taskData.category || '',
      classroom: taskData.classroom || null,
      priorityLevel: taskData.priorityLevel || 1,
      isFinished: taskData.isFinished || false,
      deadLine: normalizeTimestamp(taskData.deadLine),
      createdAt: normalizeTimestamp(taskData.createdAt),
      createdBy: teacherId,
      createdByName: createdByName,
      attachments: taskData.attachments || [],
    };

    return NextResponse.json(
      { 
        success: true,
        task: formattedTask 
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Error fetching task details:', error);
    
    if (error.code === 'auth/session-cookie-expired' || 
        error.code === 'auth/session-cookie-revoked') {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch task details',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';