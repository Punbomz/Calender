import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
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

    // Parse request body
    const body = await request.json();
    const { taskId, isFinished } = body;

    if (!taskId || typeof isFinished !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: taskId and isFinished' },
        { status: 400 }
      );
    }

    console.log('📝 Updating task status:', { taskId, isFinished, userId });

    // Update the task status in user's tasks collection
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

    // Update the isFinished status
    await taskRef.update({
      isFinished: isFinished,
      updatedAt: new Date(),
    });

    console.log('✅ Task status updated successfully');

    return NextResponse.json(
      { 
        success: true,
        message: 'Task status updated successfully',
        isFinished: isFinished
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Error updating task status:', error);
    
    if (error.code === 'auth/session-cookie-expired' || 
        error.code === 'auth/session-cookie-revoked') {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update task status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';