"use client";
import React, { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CreateClassroomModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  if (!isOpen) return null;

  
  async function handleCreateClassroom() {
    const res = await fetch("/app/classroom/create-classroom", {
      method: "POST",
      body: JSON.stringify({ name, code }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (data.success) {
      alert("สร้างเรียบร้อย");
      onClose();
    } else {
      alert("Error: " + data.error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-[350px]">
        <h2 className="text-xl font-semibold mb-4">Create Classroom</h2>

        <input
          className="border p-2 w-full rounded mb-2"
          placeholder="Classroom Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border p-2 w-full rounded mb-4"
          placeholder="Class Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white w-full py-2 rounded"
          onClick={handleCreateClassroom}
        >
          Create
        </button>

        <button className="mt-2 w-full py-2 border rounded" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
