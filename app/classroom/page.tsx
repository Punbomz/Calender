"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth, onAuthStateChanged } from "@/lib/firebaseClient";
import CreateClassroomModal from "./createClassroom";
import JoinClassroomModal from "./joinClassroom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
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
  const [openCreate, setOpenCreate] = useState(false);
  const [openJoin, setOpenJoin] = useState(false);


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

        console.log("User classrooms found:", userClassesSnap.size);
        console.log("Classroom IDs:", userClassesSnap.docs.map(d => d.id));

        if (userClassesSnap.empty) {
          console.log("No classrooms in user subcollection");
          setClassrooms([]);
          setLoading(false);
          return;
        }

        const promises = userClassesSnap.docs.map(async (c) => {
          const classroomID = c.id;
          console.log("Fetching classroom:", classroomID);
          const classRef = doc(db, "classrooms", classroomID);
          const classSnap = await getDoc(classRef);
          if (!classSnap.exists()) {
            console.log("Classroom not found in classrooms collection:", classroomID);
            return null;
          }
          const data = classSnap.data() as Omit<Classroom, "classroomID">;
          console.log("Classroom data:", { classroomID, ...data });
          return { classroomID, ...data } as Classroom;
        });

        const result = await Promise.all(promises);
        const validClassrooms = result.filter((c): c is Classroom => c !== null);
        console.log("Final classrooms:", validClassrooms);
        setClassrooms(validClassrooms);
      } catch (err) {
        console.error("Error fetching classrooms:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const handleCreate = () => {
    // TODO: Open create classroom modal
    console.log("Create classroom clicked");
  };

  const handleJoin = () => {
    // TODO: Open join classroom modal
    console.log("Join classroom clicked");
  };

  if (loading) {
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

        {/* Content with skeleton */}
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
            {/* Button skeleton */}
            <div
              style={{
                backgroundColor: "#c0c0c0",
                borderRadius: 10,
                padding: "8px 24px",
                fontSize: 20,
                height: 40,
                width: 120,
                margin: "0 auto 16px",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />

            {/* List skeleton */}
            <div
              style={{
                backgroundColor: "#aaaaaa",
                borderRadius: 10,
                padding: 12,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 6px",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: "#c0c0c0",
                      borderRadius: 4,
                      marginRight: 15,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  <div
                    style={{
                      height: 20,
                      backgroundColor: "#c0c0c0",
                      borderRadius: 4,
                      flex: 1,
                      maxWidth: 200,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Keyframe animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          .classroom-item:hover {
            background-color: #6c3b2a !important;
            color: white !important;
          }
        `}</style>
      </div>
    );
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
            onClick={() => {
              if (role === "teacher") setOpenCreate(true);
              else setOpenJoin(true);
            }}
            style={{
              backgroundColor: "#6c3b2a",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "8px 24px",
              fontSize: 20,
              fontWeight: "bold",
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
              color: "black"
            }}
          >
            {classrooms.map((room) => (
              <button
                key={room.classroomID}
                onClick={() =>
                  console.log("Open classroom:", room.classroomID)
                }
                className="classroom-item"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 6px",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  borderRadius: 8,
                  transition: "all 0.2s ease",
                  color: "black",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 24,
                    marginRight: 15,
                    fontSize: 20,
                  }}
                >
                  🏠
                </span>
                <span
                  style={{
                    fontSize: 20,
                    letterSpacing: 1,
                    fontWeight: "bold",
                  }}
                >
                  {room.name}
                </span>
              </button>
            ))}

            {classrooms.length === 0 && (
              <div style={{ padding: 8 }}>ยังไม่มีห้องเรียนในบัญชีนี้</div>
            )}

            <CreateClassroomModal isOpen={openCreate} onClose={() => setOpenCreate(false)} />
            <JoinClassroomModal isOpen={openJoin} onClose={() => setOpenJoin(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}