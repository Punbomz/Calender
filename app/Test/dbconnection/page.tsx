'use client';

import { useEffect } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { collection, getDocs } from "firebase/firestore";

export default function TestFirebase() {
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log("Firebase Auth object:", auth);
        console.log("Firestore DB object:", db);

        // 🔹 ทดลองอ่าน collection จาก Firestore
        const snapshot = await getDocs(collection(db, "users"));
        snapshot.forEach((doc) => {
          console.log("User:", doc.id, "=>", doc.data());
        });

        alert("✅ Firebase connected successfully!");
      } catch (error) {
        console.error("❌ Firebase connection failed:", error);
        alert("❌ Firebase connection failed: " + error);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Testing Firebase Connection...</h1>
      <p>Check your browser console (F12 → Console tab)</p>
    </div>
  );
}
