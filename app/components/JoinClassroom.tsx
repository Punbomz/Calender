"use client";
import React, { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function JoinClassroomModal({ isOpen, onClose }: Props) {
  const [code, setCode] = useState("");

  if (!isOpen) return null;

 
  async function handleJoinClassroom() {
    const res = await fetch("/app/classroom/join-classroom", {
      method: "POST",
      body: JSON.stringify({ code }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (data.success) {
      alert("เข้าร่วมห้องสำเร็จ");
      onClose();
    } else {
      alert("Error: " + data.error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-[350px]">
        <h2 className="text-xl font-semibold mb-4">Join Classroom</h2>

        <input
          className="border p-2 w-full rounded mb-4"
          placeholder="Enter Class Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button
          className="bg-green-600 text-white w-full py-2 rounded"
          onClick={handleJoinClassroom}
        >
          Join
        </button>

        <button className="mt-2 w-full py-2 border rounded" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
