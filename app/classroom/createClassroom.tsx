"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (name: string) => void;
  title?: string;
};

export default function CreateClassroomModal({
  isOpen,
  onClose,
  onCreate,
  title = "Create Classroom",
}: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => inputRef.current?.focus(), 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
      setName("");
      setError("");
      setLoading(false);
    };
  }, [isOpen, onClose]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("กรุณากรอกชื่อห้องเรียน");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/classroom/createClassroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("สร้างห้องเรียนสำเร็จ!"); // แจ้งเตือนเมื่อสร้างสำเร็จ
        onCreate?.(name.trim());
        onClose();
      } else {
        setError(data.error || "สร้างห้องเรียนไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาด โปรดลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            initial={{ y: 24, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <button
              onClick={onClose}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>

            <h2 className="mb-4 text-center text-xl font-semibold text-gray-900">
              {title}
            </h2>

            {error && (
              <div className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-700 mb-3">
                {error}
              </div>
            )}

            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Classroom Name"
              disabled={loading}
              className="w-full rounded-full border px-4 py-2 text-sm shadow-inner outline-none ring-2 ring-transparent focus:ring-blue-400"
            />

            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || loading}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md enabled:hover:opacity-90 disabled:opacity-40"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
