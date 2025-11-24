// app/components/ClassroomSyncManager.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function ClassroomSyncManager() {
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(true);

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

    // Set up periodic sync every 30 seconds (for testing)
    // Change to 300000 (5 minutes) for production
    const intervalMs = 30000;
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

  // Always show debug panel
  // return (
  //   <div 
  //     style={{
  //       position: 'fixed',
  //       bottom: '20px',
  //       right: '20px',
  //       background: 'rgba(0, 0, 0, 0.9)',
  //       color: 'white',
  //       padding: '16px',
  //       borderRadius: '8px',
  //       fontSize: '12px',
  //       zIndex: 9999,
  //       maxWidth: '320px',
  //       boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  //       fontFamily: 'monospace',
  //     }}
  //   >
  //     <div style={{ 
  //       display: 'flex', 
  //       justifyContent: 'space-between', 
  //       alignItems: 'center',
  //       marginBottom: '12px' 
  //     }}>
  //       <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
  //         🔄 Classroom Sync
  //       </div>
  //       <button
  //         onClick={() => setShowDebug(!showDebug)}
  //         style={{
  //           background: 'transparent',
  //           border: '1px solid #666',
  //           color: 'white',
  //           padding: '2px 8px',
  //           borderRadius: '4px',
  //           cursor: 'pointer',
  //           fontSize: '10px',
  //         }}
  //       >
  //         {showDebug ? 'Hide' : 'Show'}
  //       </button>
  //     </div>
      
  //     {showDebug && (
  //       <>
  //         {lastSync && (
  //           <div style={{ marginBottom: '8px', color: '#aaa' }}>
  //             Last sync: {lastSync.toLocaleTimeString()}
  //           </div>
  //         )}
          
  //         {syncStats && !syncStats.error && (
  //           <div style={{ 
  //             marginBottom: '12px', 
  //             fontSize: '11px',
  //             background: 'rgba(255,255,255,0.1)',
  //             padding: '8px',
  //             borderRadius: '4px'
  //           }}>
  //             <div style={{ color: '#4CAF50' }}>✅ Added: {syncStats.tasksAdded}</div>
  //             <div style={{ color: '#ff9800' }}>🗑️ Deleted: {syncStats.tasksDeleted}</div>
  //             <div style={{ color: '#2196F3' }}>🔔 New: {syncStats.notifications}</div>
  //             <div style={{ color: '#f44336' }}>❌ Classrooms: {syncStats.classroomsDeleted}</div>
  //           </div>
  //         )}
          
  //         {syncStats?.error && (
  //           <div style={{ 
  //             marginBottom: '12px', 
  //             fontSize: '11px',
  //             background: 'rgba(244, 67, 54, 0.2)',
  //             padding: '8px',
  //             borderRadius: '4px',
  //             color: '#ff5252'
  //           }}>
  //             Error: {syncStats.error}
  //           </div>
  //         )}
  //       </>
  //     )}
      
  //     <button
  //       onClick={syncClassroomTasks}
  //       disabled={isSyncing}
  //       style={{
  //         background: isSyncing ? '#666' : '#4CAF50',
  //         color: 'white',
  //         border: 'none',
  //         padding: '8px 16px',
  //         borderRadius: '4px',
  //         cursor: isSyncing ? 'not-allowed' : 'pointer',
  //         fontSize: '12px',
  //         width: '100%',
  //         fontWeight: 'bold',
  //         transition: 'background 0.2s',
  //       }}
  //     >
  //       {isSyncing ? '⏳ Syncing...' : '🔄 Sync Now'}
  //     </button>
      
  //     <div style={{ 
  //       marginTop: '8px', 
  //       fontSize: '10px', 
  //       color: '#888',
  //       textAlign: 'center' 
  //     }}>
  //       Auto-sync every 30 seconds
  //     </div>
  //   </div>
  // );
}