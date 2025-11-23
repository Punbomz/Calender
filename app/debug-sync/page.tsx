// app/debug-sync/page.tsx
"use client";

import { useState } from "react";

export default function DebugSyncPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  const checkUserRole = async () => {
    try {
      console.log("=".repeat(60));
      console.log("👤 CHECKING USER INFO");
      console.log("=".repeat(60));
      
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      
      console.log("User data:", data);
      
      const role = data.role || data.user?.role || "unknown";
      const classrooms = data.classrooms || data.user?.classrooms || [];
      
      console.log("Role:", role);
      console.log("Classrooms:", classrooms);
      
      setUserInfo({ role, classrooms, fullData: data });
      
      if (role !== "student") {
        alert(
          `⚠️ WARNING: You are logged in as "${role.toUpperCase()}"\n\n` +
          `The classroom sync only works for STUDENTS.\n\n` +
          `Please log in as a student to test the sync feature.`
        );
      } else {
        alert(
          `✅ You are logged in as a STUDENT\n\n` +
          `Classrooms: ${classrooms.length}\n\n` +
          `You can now test the sync feature!`
        );
      }
      
      console.log("=".repeat(60));
    } catch (err) {
      console.error("❌ Error checking user:", err);
      alert("Error checking user info. Make sure you're logged in.");
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("=".repeat(60));
      console.log("🚀 MANUAL SYNC TRIGGERED");
      console.log("=".repeat(60));
      
      const response = await fetch("/api/classroom/sync-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response status:", response.status);
      const data = await response.json();
      console.log("📦 Full Response data:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.error || data.details || "Sync failed");
      }

      setResult(data);
      
      // Additional check
      if (data.success && data.stats) {
        console.log("=".repeat(60));
        console.log("📊 SYNC RESULTS SUMMARY:");
        console.log(`   Classrooms Deleted: ${data.stats.classroomsDeleted}`);
        console.log(`   Tasks Deleted: ${data.stats.tasksDeleted}`);
        console.log(`   Tasks Added: ${data.stats.tasksAdded}`);
        console.log(`   Notifications: ${data.stats.notifications}`);
        console.log("=".repeat(60));
        
        if (data.stats.tasksAdded === 0 && data.stats.tasksDeleted === 0) {
          console.log("⚠️ NO CHANGES DETECTED");
          console.log("   This means:");
          console.log("   1. Student already has all classroom tasks");
          console.log("   2. OR no new tasks were added to classroom");
          console.log("   3. Check server logs for detailed task comparison");
        }
      }
    } catch (err) {
      console.error("❌ Sync error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const checkCurrentTasks = async () => {
    try {
      console.log("=".repeat(60));
      console.log("🔍 CHECKING CURRENT TASKS");
      console.log("=".repeat(60));
      
      // Try multiple possible endpoints
      let response;
      let data;
      
      try {
        response = await fetch("/api/task/getAllTask");
        if (response.ok) {
          data = await response.json();
        }
      } catch (e) {
        console.log("Trying alternative endpoint...");
        response = await fetch("/api/tasks");
        data = await response.json();
      }
      
      console.log("📦 API Response:", data);
      
      const tasks = data.tasks || data.data || [];
      console.log("📋 Total tasks:", tasks.length);
      
      const classroomTasks = tasks.filter((t: any) => t.classroom);
      console.log("📚 Classroom tasks:", classroomTasks.length);
      
      if (classroomTasks.length > 0) {
        console.log("\n📝 Classroom tasks details:");
        classroomTasks.forEach((task: any, index: number) => {
          console.log(`\n   Task ${index + 1}:`);
          console.log(`   - Name: ${task.taskName}`);
          console.log(`   - Classroom ID: ${task.classroom}`);
          console.log(`   - Classroom Task ID: ${task.classroomTaskId || "❌ MISSING!"}`);
          console.log(`   - Created At: ${task.createdAt}`);
        });
      } else {
        console.log("\n⚠️ No classroom tasks found");
        console.log("   This could mean:");
        console.log("   1. Student hasn't joined any classrooms");
        console.log("   2. Classrooms have no tasks");
        console.log("   3. Tasks haven't been synced yet");
      }
      
      console.log("=".repeat(60));
      
      alert(
        `Total tasks: ${tasks.length}\n` +
        `Classroom tasks: ${classroomTasks.length}\n\n` +
        `Check console for detailed breakdown.`
      );
    } catch (err) {
      console.error("❌ Error checking tasks:", err);
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}\n\nMake sure you're logged in and try /api/task/getAllTask endpoint exists.`);
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      console.log("🔔 Notification permission:", permission);
      alert(`Notification permission: ${permission}`);
      
      if (permission === "granted") {
        new Notification("Test Notification", {
          body: "This is a test notification",
          icon: "/favicon.ico",
        });
      }
    } else {
      alert("Notifications not supported in this browser");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">
          🔧 Classroom Sync Debug Page
        </h1>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Actions</h2>
          
          <div className="space-y-3">
            <button
              onClick={checkUserRole}
              className="w-full rounded-lg bg-indigo-500 px-6 py-3 font-semibold text-white hover:bg-indigo-600"
            >
              👤 Check User Role
            </button>

            <button
              onClick={checkCurrentTasks}
              className="w-full rounded-lg bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600"
            >
              🔍 Check Current Tasks
            </button>

            <button
              onClick={handleSync}
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "🔄 Syncing..." : "🔄 Manual Sync"}
            </button>

            <button
              onClick={requestNotificationPermission}
              className="w-full rounded-lg bg-purple-500 px-6 py-3 font-semibold text-white hover:bg-purple-600"
            >
              🔔 Request Notification Permission
            </button>

            <button
              onClick={() => {
                console.clear();
                console.log("✨ Console cleared. Ready for new logs.");
              }}
              className="w-full rounded-lg bg-gray-500 px-6 py-3 font-semibold text-white hover:bg-gray-600"
            >
              🧹 Clear Console
            </button>
          </div>
        </div>

        {userInfo && (
          <div className="mb-6 rounded-lg bg-indigo-50 p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-indigo-800">
              👤 Current User Info
            </h2>
            <div className="space-y-2 text-indigo-700">
              <p>
                <strong>Role:</strong>{" "}
                <span
                  className={`rounded px-2 py-1 font-mono ${
                    userInfo.role === "student"
                      ? "bg-green-200 text-green-800"
                      : "bg-yellow-200 text-yellow-800"
                  }`}
                >
                  {userInfo.role}
                </span>
              </p>
              <p>
                <strong>Classrooms:</strong> {userInfo.classrooms.length}
              </p>
              {userInfo.role !== "student" && (
                <p className="mt-2 rounded bg-yellow-100 p-2 text-sm text-yellow-800">
                  ⚠️ Warning: Sync only works for students. Please log in as a
                  student account.
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-6 shadow">
            <h2 className="mb-2 text-xl font-semibold text-red-800">❌ Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="mb-6 rounded-lg bg-green-50 p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-green-800">
              ✅ Sync Result
            </h2>
            
            <div className="space-y-2">
              <p className="text-green-700">
                <strong>Status:</strong> {result.message}
              </p>
              
              {result.stats && (
                <div className="mt-4 space-y-2 rounded bg-white p-4">
                  <h3 className="font-semibold text-gray-800">📊 Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Classrooms Deleted</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {result.stats.classroomsDeleted}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tasks Deleted</p>
                      <p className="text-2xl font-bold text-red-600">
                        {result.stats.tasksDeleted}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tasks Added</p>
                      <p className="text-2xl font-bold text-green-600">
                        {result.stats.tasksAdded}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Notifications</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {result.stats.notifications}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-green-700">
                View Raw Response
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-gray-800 p-4 text-xs text-green-400">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="rounded-lg bg-blue-50 p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-blue-800">
            📚 How to Debug
          </h2>
          
          <ol className="list-inside list-decimal space-y-2 text-blue-700">
            <li>Open browser console (F12)</li>
            <li>Click "Manual Sync" button</li>
            <li>Watch console for detailed logs starting with:</li>
            <ul className="ml-6 mt-2 list-inside list-disc space-y-1 text-sm">
              <li>🔄 Starting classroom sync for user</li>
              <li>📚 User is in X classrooms</li>
              <li>🔍 Syncing tasks for classroom</li>
              <li>📋 Found X tasks in classroom</li>
              <li>👤 Student has X tasks</li>
              <li>➕ Adding new task (if any)</li>
            </ul>
            <li>Check the stats in the green box above</li>
            <li>If "Tasks Added" is 0 but you expect tasks, check server logs</li>
          </ol>
        </div>

        <div className="mt-6 rounded-lg bg-yellow-50 p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-yellow-800">
            🔍 Checklist
          </h2>
          
          <ul className="space-y-2 text-yellow-700">
            <li>✓ Are you logged in as a STUDENT?</li>
            <li>✓ Is the student in any classrooms?</li>
            <li>✓ Does the classroom have tasks in /tasks subcollection?</li>
            <li>✓ Do existing student tasks have "classroomTaskId" field?</li>
            <li>✓ Are there any errors in the browser console?</li>
            <li>✓ Are there any errors in the server terminal?</li>
          </ul>
        </div>
      </div>
    </div>
  );
}