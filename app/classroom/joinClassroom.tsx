"use client";
import React, { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function JoinClassroomModal({ isOpen, onClose }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleJoinClassroom() {
    if (!code.trim()) {
      alert("กรุณากรอกรหัสห้องเรียน");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/classroom/joinClassroom", {
        method: "POST",
        body: JSON.stringify({ code }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setLoading(false);

      // Check if already joined
      if (data.alreadyJoined) {
        alert("คุณอยู่ในห้องเรียนนี้แล้ว");
        onClose();
        return;
      }

      // Check if successful join
      if (data.success) {
        alert(`เข้าร่วมห้อง ${data.name} สำเร็จ!`);
        onClose();
        // Optionally reload the page to show the new classroom
        window.location.reload();
        return;
      }

      // Handle other errors
      if (data.error) {
        alert("Error: " + data.error);
      }
    } catch (error) {
      setLoading(false);
      alert("เกิดข้อผิดพลาด: " + error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[350px] shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Join Classroom</h2>

        <input
          className="border p-2 w-full rounded mb-4"
          placeholder="Enter Class Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button
          className="bg-green-600 text-white w-full py-2 rounded disabled:bg-green-300"
          onClick={handleJoinClassroom}
          disabled={loading}
        >
          {loading ? "Joining..." : "Join"}
        </button>

        <button
          className="mt-2 w-full py-2 border rounded"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}