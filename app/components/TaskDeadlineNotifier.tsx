"use client";

import { useEffect, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function TaskDeadlineNotifier() {
  const hasRequestedPermission = useRef(false);
  const notifiedTasks = useRef(new Set<string>()); // Track which tasks we've already notified about

  useEffect(() => {
    const auth = getAuth();

    // ✅ Request notification permission once
    if (!hasRequestedPermission.current && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
      hasRequestedPermission.current = true;
    }

    const checkTasks = async (userId: string) => {
      try {
        const q = query(
          collection(db, "tasks"),
          where("userId", "==", userId)
        );
        const snapshot = await getDocs(q);
        const now = new Date();

        snapshot.forEach((doc) => {
          const task = doc.data();
          const taskId = doc.id;
          
          // Skip if we've already notified about this task
          if (notifiedTasks.current.has(taskId)) {
            return;
          }

          const deadline = new Date(task.deadline);
          const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

          console.log(`Task: ${task.title}, Hours until deadline: ${diffHours.toFixed(2)}`);

          // Notify if deadline is within 24 hours and still in the future
          if (diffHours > 0 && diffHours <= 24) {
            if (Notification.permission === "granted") {
              new Notification("📅 แจ้งเตือนงานใกล้ครบกำหนด", {
                body: `งาน "${task.title}" จะครบกำหนดในอีก ${Math.round(diffHours)} ชั่วโมง\nครบเวลา: ${deadline.toLocaleString("th-TH")}`,
                icon: "/icon.png",
                tag: taskId, // Prevent duplicate notifications for same task
              });
              console.log(`✅ Notification sent for: ${task.title}`);
              notifiedTasks.current.add(taskId); // Mark as notified
            } else {
              console.warn("⚠️ Notification permission not granted");
              alert(`⚠️ งาน "${task.title}" ใกล้ครบกำหนดในอีก ${Math.round(diffHours)} ชั่วโมง`);
            }
          }
        });
      } catch (err) {
        console.error("❌ Error checking tasks:", err);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      // Check immediately
      checkTasks(user.uid);

      // ✅ Check every 30 minutes
      const interval = setInterval(() => {
        checkTasks(user.uid);
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    });

    return () => unsubscribe();
  }, []);

  return null;
}