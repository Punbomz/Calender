// app/components/ClassroomSyncManager.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function ClassroomSyncManager() {
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<any>(null);

  const syncClassroomTasks = async () => {
    try {
      setIsSyncing(true);
      console.log("🔄 [CLIENT] Starting sync...");
      console.log("🔄 [CLIENT] Current time:", new Date().toISOString());
      
      const response = await fetch("/api/classroom/sync-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 [CLIENT] Response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log("ℹ️ [CLIENT] Not logged in, skipping classroom sync");
          setSyncStats({ error: "Not logged in" });
          return;
        }
        throw new Error(`Failed to sync: ${response.status}`);
      }

      const data = await response.json();
      
      console.log("📥 [CLIENT] Full sync response:", JSON.stringify(data, null, 2));
      
      if (data.success) {
        const { stats } = data;
        
        console.log("📊 [CLIENT] Sync stats:", stats);
        console.log("   - Classrooms deleted:", stats.classroomsDeleted);
        console.log("   - Tasks deleted:", stats.tasksDeleted);
        console.log("   - Tasks added:", stats.tasksAdded);
        console.log("   - Notifications:", stats.notifications);
        
        setSyncStats(stats);
        setLastSync(new Date());
        
        // Check if there were any changes
        const hasChanges = stats.classroomsDeleted > 0 || 
                          stats.tasksDeleted > 0 || 
                          stats.tasksAdded > 0;
        
        if (hasChanges) {
          console.log("✅ [CLIENT] Classroom sync completed WITH CHANGES:", stats);
          
          // Show notification if new tasks were added
          if (stats.notifications > 0) {
            console.log(`🔔 [CLIENT] ${stats.notifications} new classroom task(s) added!`);
            
            // Try to show browser notification
            if (typeof window !== "undefined" && "Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification("New Classroom Tasks", {
                  body: `You have ${stats.notifications} new task(s) from your classrooms`,
                  icon: "/favicon.ico",
                });
              } else if (Notification.permission === "default") {
                Notification.requestPermission().then(permission => {
                  if (permission === "granted") {
                    new Notification("New Classroom Tasks", {
                      body: `You have ${stats.notifications} new task(s) from your classrooms`,
                      icon: "/favicon.ico",
                    });
                  }
                });
              }
            }
            
            // Dispatch event for other components to refresh
            window.dispatchEvent(new CustomEvent('tasksUpdated', { detail: stats }));
          }
        } else {
          console.log("✅ [CLIENT] Classroom sync completed (no changes)");
        }
      } else {
        console.error("❌ [CLIENT] Sync failed:", data);
        setSyncStats({ error: data.error || "Unknown error" });
      }
    } catch (error) {
      console.error("❌ [CLIENT] Error syncing classroom tasks:", error);
      setSyncStats({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log("🚀 [CLIENT] ClassroomSyncManager initialized");

    // Request notification permission on mount
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("🔔 [CLIENT] Notification permission:", permission);
      });
    }

    // Initial sync when component mounts
    console.log("🔄 [CLIENT] Running initial sync...");
    syncClassroomTasks();

    // Set up periodic sync every 5 minutes (300000ms)
    const intervalMs = 300000; // 5 minutes for production
    console.log(`⏰ [CLIENT] Setting up sync interval: ${intervalMs}ms (${intervalMs/1000} seconds)`);
    
    syncIntervalRef.current = setInterval(() => {
      console.log("⏰ [CLIENT] Interval triggered - running sync");
      syncClassroomTasks();
    }, intervalMs);

    return () => {
      console.log("🛑 [CLIENT] ClassroomSyncManager unmounting, clearing interval");
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []);

  // Return null - this component doesn't render anything visible
  return null;
}