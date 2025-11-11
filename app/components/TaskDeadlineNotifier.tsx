"use client";

import { useEffect, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function TaskDeadlineNotifier() {
  const hasRun = useRef(false); // ✅ ป้องกันรันซ้ำ

  useEffect(() => {
    if (hasRun.current) return; // รันครั้งเดียวเท่านั้น
    hasRun.current = true;

    const auth = getAuth();

    // ✅ ขออนุญาต Notification ก่อน (ถ้ายังไม่ได้ให้สิทธิ์)
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "tasks"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const now = new Date();

        snapshot.forEach((doc) => {
          const task = doc.data();
          const deadline = new Date(task.deadline);
          const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

          if (diffHours > 0 && diffHours <= 24) {
            // 🔔 ส่ง Notification จริงของระบบปฏิบัติการ
            if (Notification.permission === "granted") {
              new Notification("📅 แจ้งเตือนงานใกล้ครบกำหนด", {
                body: `งาน "${task.title}" จะครบกำหนดในอีกไม่เกิน 1 วัน\nครบเวลา: ${deadline.toLocaleString("th-TH")}`,
                icon: "/icon.png", // ใส่ไอคอนเว็บคุณ (optional)
              });
            } else {
              alert(`⚠️ งาน "${task.title}" ใกล้ครบกำหนดในอีกไม่เกิน 1 วัน`);
            }
          }
        });
      } catch (err) {
        console.error("❌ Error checking tasks:", err);
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
