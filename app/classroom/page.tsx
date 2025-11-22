"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth, onAuthStateChanged } from "@/lib/firebaseClient";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

type Classroom = {
  classroomID: string;
  code: string;
  name: string;
  teacher: string;
  students: string[];
};

export default function ClassroomPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"teacher" | "student" | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const uid = user.uid;

        // อ่าน role จาก users/{uid}
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data() as { role?: string };
          setRole((data.role as any) || "student");
        } else {
          setRole("student");
        }

        // อ่าน classrooms ของ user
        const userClassesCol = collection(db, "users", uid, "classrooms");
        const userClassesSnap = await getDocs(userClassesCol);

        if (userClassesSnap.empty) {
          setClassrooms([]);
          setLoading(false);
          return;
        }

        const promises = userClassesSnap.docs.map(async (c) => {
          const classroomID = c.id;
          const classRef = doc(db, "classrooms", classroomID);
          const classSnap = await getDoc(classRef);
          if (!classSnap.exists()) return null;
          const data = classSnap.data() as Omit<Classroom, "classroomID">;
          return { classroomID, ...data } as Classroom;
        });

        const result = await Promise.all(promises);
        setClassrooms(result.filter((c): c is Classroom => c !== null));
      } catch (err) {
        console.error("Error fetching classrooms:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // -------------------- TEACHER: CREATE --------------------
  const handleCreate = () => {
    alert("TODO: หน้าให้ครูสร้าง classroom ใหม่ (เพื่อนน่าจะทำต่อ)");
  };

  // -------------------- STUDENT: JOIN --------------------
  const handleJoin = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    const uid = user.uid;
    const code = prompt("กรอก Class Code เช่น CPE334-01");

    if (!code) return;

    try {
      // หา classroom จาก code
      const q = query(
        collection(db, "classrooms"),
        where("code", "==", code)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        alert("ไม่พบห้องเรียนด้วย code นี้");
        return;
      }

      // สมมติว่า code ไม่ซ้ำ เอาอันแรก
      const classroomDoc = snap.docs[0];
      const classroomID = classroomDoc.id;

      // 1) เพิ่มใน users/{uid}/classrooms/{classroomID}
      const userClassRef = doc(db, "users", uid, "classrooms", classroomID);
      await setDoc(
        userClassRef,
        {
          joinedAt: new Date(),
        },
        { merge: true }
      );

      // 2) เพิ่ม uid ใน classrooms/{classroomID}.students
      const classroomRef = doc(db, "classrooms", classroomID);
      await updateDoc(classroomRef, {
        students: arrayUnion(uid),
      });

      alert("เข้าร่วมห้องเรียนสำเร็จ ✅");
      // reload list แบบง่าย ๆ
      setClassrooms((prev) => {
        const data = classroomDoc.data() as any;
        // ถ้าเดิมไม่มี ก็เพิ่มใหม่เข้า state
        if (prev.find((c) => c.classroomID === classroomID)) return prev;
        return [
          ...prev,
          {
            classroomID,
            code: data.code,
            name: data.name,
            teacher: data.teacher,
            students: data.students || [],
          },
        ];
      });
    } catch (err) {
      console.error("Join classroom error:", err);
      alert("เข้าร่วมห้องเรียนไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  };

  if (loading) {
    return <div style={{ padding: 16 }}>Loading...</div>;
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#e5e5e5",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          backgroundColor: "black",
          color: "white",
          padding: "12px 16px",
          fontFamily: "monospace",
          fontSize: 20,
        }}
      >
        My Classroom
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: 16,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
          }}
        >
          {/* ปุ่มด้านบน: ถ้า teacher → Create, ถ้า student → Join */}
          <button
            onClick={role === "teacher" ? handleCreate : handleJoin}
            style={{
              backgroundColor: "#6c3b2a",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "8px 24px",
              fontSize: 16,
              cursor: "pointer",
              display: "block",
              margin: "0 auto 16px",
            }}
          >
            {role === "teacher" ? "+ Create" : "+ Join"}
          </button>

          {/* List ห้องเรียน */}
          <div
            style={{
              backgroundColor: "#aaaaaa",
              borderRadius: 10,
              padding: 12,
            }}
          >
            {classrooms.map((room) => (
              <button
                key={room.classroomID}
                onClick={() =>
                  console.log("Open classroom:", room.classroomID)
                }
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 6px",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 24,
                    marginRight: 8,
                    fontSize: 18,
                  }}
                >
                  🏠
                </span>
                <span
                  style={{
                    fontSize: 16,
                    letterSpacing: 1,
                  }}
                >
                  {room.code}
                </span>
              </button>
            ))}

            {classrooms.length === 0 && (
              <div style={{ padding: 8 }}>ยังไม่มีห้องเรียนในบัญชีนี้</div>
            )}
          </div>
        </div>
      </div>

      {/* bottom nav ของนาย */}
      <div
        style={{
          height: 56,
          backgroundColor: "black",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          color: "white",
          fontSize: 22,
        }}
      >
        <Link href="/calendar" style={{ color: "white" }}>
          📅
        </Link>
        <Link href="/task" style={{ color: "white" }}>
          📄
        </Link>
        <Link href="/profile" style={{ color: "white" }}>
          👤
        </Link>
      </div>
    </div>
  );
}
