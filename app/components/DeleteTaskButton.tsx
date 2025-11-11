"use client";

import { useState } from "react";
import { deleteTaskById } from "@/lib/tasks";

export default function DeleteTaskButton({
  taskId,
  taskTitle,
  onRemoved,
}: {
  taskId: string;
  taskTitle?: string;
  onRemoved?: (id: string) => void; // ให้ parent ลบออกจาก state แบบ optimistic
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    onRemoved?.(taskId); // optimistic: เอาออกจากลิสต์ก่อน
    try {
      await deleteTaskById(taskId);
    } catch (e) {
      alert("ลบไม่สำเร็จ ลองใหม่อีกครั้ง");
      // ถ้าต้อง rollback ให้ parent refetch รายการ
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
        aria-label={`Delete ${taskTitle ?? "task"}`}
      >
        🗑️ Delete
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white text-black rounded-xl p-4 w-80">
            <p className="mb-4">ลบ “{taskTitle ?? "งานนี้"}” จริงไหม?</p>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1" onClick={() => setConfirmOpen(false)}>ยกเลิก</button>
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
