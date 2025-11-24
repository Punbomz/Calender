"use client";

import { useState } from "react";

export default function DeleteClassroomButton({
  classroomId,
  className,
  onRemoved,
}: {
  classroomId: string;
  className?: string;
  onRemoved?: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    onRemoved?.(classroomId);
    try {
      const response = await fetch("/api/classroom/deleteClassroomById", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classroomId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Delete failed");
      }
    } catch (e) {
      console.error(e);
      alert("ลบ Classroom ไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <button
        className="rounded-md px-2 py-1 text-sm border border-white/20 hover:bg-red-500/10 disabled:opacity-50"
        onClick={() => setConfirmOpen(true)}
        disabled={deleting}
        aria-label={`Delete ${className ?? "classroom"}`}
      >
        🗑️ Delete
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white text-black rounded-xl p-4 w-80">
            <p className="mb-4">ลบ Classroom "{className ?? "ห้องเรียนนี้"}" จริงไหม?</p>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1" onClick={() => setConfirmOpen(false)}>
                ยกเลิก
              </button>
              <button
                className="px-3 py-1 rounded-md bg-red-600 text-white"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "กำลังลบ..." : "ลบเลย"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}