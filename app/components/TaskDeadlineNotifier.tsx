"use client";

import { useEffect, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function TaskDeadlineNotifier() {
  const hasRequestedPermission = useRef(false);
  const notifiedTasks = useRef(new Set<string>());
  const listenerUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    const auth = getAuth();

    // ✅ Request notification permission once
    if (!hasRequestedPermission.current && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("🔔 Notification permission:", permission);
      });
      hasRequestedPermission.current = true;
    }

    const setupTaskListener = (userId: string) => {
      console.log("🔍 Setting up task listener for user:", userId);
      
      // ✅ Query tasks from the user's subcollection
      const q = query(collection(db, `users/${userId}/tasks`));

      // ✅ Use onSnapshot for real-time updates and better auth handling
      listenerUnsubscribe.current = onSnapshot(
        q,
        (snapshot) => {
          const now = new Date();
          console.log(`📋 Checking ${snapshot.docs.length} tasks for deadlines...`);

          let foundUpcoming = false;

          snapshot.forEach((doc) => {
            const task = doc.data();
            const taskId = doc.id;

            // ✅ Use taskName instead of title (matches your Firestore structure)
            const taskTitle = task.taskName || task.title || "Untitled Task";

            // Skip if already notified
            if (notifiedTasks.current.has(taskId)) {
              console.log(`⏭️ Already notified: ${taskTitle}`);
              return;
            }

            // ✅ Handle both deadLine and deadline (case-insensitive)
            const deadlineField = task.deadLine || task.deadline;
            
            if (!deadlineField) {
              console.warn(`⚠️ Task "${taskTitle}" has no deadline`);
              return;
            }

            // Parse deadline - handle Firestore Timestamp or string
            let deadline;
            if (deadlineField.toDate) {
              deadline = deadlineField.toDate(); // Firestore Timestamp
            } else {
              deadline = new Date(deadlineField); // String
            }

            const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

            console.log(`📌 Task: "${taskTitle}" | Deadline: ${deadline.toLocaleString("th-TH")} | Hours remaining: ${diffHours.toFixed(2)}`);

            // Notify if within 24 hours and still in the future
            if (diffHours > 0 && diffHours <= 24) {
              foundUpcoming = true;
              
              if (Notification.permission === "granted") {
                new Notification("📅 แจ้งเตือนงานใกล้ครบกำหนด", {
                  body: `งาน "${taskTitle}" จะครบกำหนดในอีก ${Math.round(diffHours)} ชั่วโมง\nครบเวลา: ${deadline.toLocaleString("th-TH")}`,
                  icon: "/icon.png",
                  tag: taskId,
                  requireInteraction: true,
                });
                console.log(`✅ Notification sent for: ${taskTitle}`);
                notifiedTasks.current.add(taskId);
              } else if (Notification.permission === "denied") {
                console.error("❌ Notifications are BLOCKED. Enable in browser settings!");
              } else {
                console.warn("⚠️ Notification permission:", Notification.permission);
                alert(`⚠️ งาน "${taskTitle}" ใกล้ครบกำหนดในอีก ${Math.round(diffHours)} ชั่วโมง`);
              }
            } else if (diffHours <= 0) {
              console.log(`⏰ Task "${taskTitle}" is overdue by ${Math.abs(diffHours).toFixed(2)} hours`);
            }
          });

          if (!foundUpcoming) {
            console.log("✨ No tasks due within 24 hours");
          }
        },
        (error) => {
          console.error("❌ Firestore error:", error);
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);
          
          // Show helpful error messages
          if (error.code === "permission-denied") {
            console.error("🚨 FIX NEEDED: Update your Firestore security rules!");
            console.error("Go to: Firebase Console > Firestore Database > Rules");
          }
        }
      );
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous listener
      if (listenerUnsubscribe.current) {
        listenerUnsubscribe.current();
        listenerUnsubscribe.current = null;
      }

      if (!user) {
        console.log("❌ No user logged in - notifications disabled");
        return;
      }

      console.log("✅ User authenticated:", user.uid);
      
      // Wait for auth to fully propagate to Firestore
      setTimeout(() => {
        setupTaskListener(user.uid);
      }, 1500);
    });

    return () => {
      unsubscribeAuth();
      if (listenerUnsubscribe.current) {
        listenerUnsubscribe.current();
      }
    };
  }, []);

  return null;
}