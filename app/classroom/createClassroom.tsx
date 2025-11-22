"use client";
import React, { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CreateClassroomModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleCreateClassroom() {
    if (!name.trim()) {
      alert("กรอกชื่อห้องเรียน");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/classroom/createClassroom", {
      method: "POST",
      body: JSON.stringify({ name }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      alert("สร้างห้องเรียนสำเร็จ!");
      onClose();
    } else {
      alert("Error: " + data.error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[350px] shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Create Classroom</h2>

        <input
          className="border p-2 w-full rounded mb-4"
          placeholder="Classroom Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white w-full py-2 rounded disabled:bg-blue-300"
          onClick={handleCreateClassroom}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create"}
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
