"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onJoin?: (code: string) => void;
  title?: string;
};

export default function JoinClassroomModal({
  isOpen,
  onClose,
  onJoin,
  title = "Join Classroom",
}: Props) {
  const [code, setCode] = useState("");
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
      setCode("");
      setError("");
      setLoading(false);
    };
  }, [isOpen, onClose]);

  const handleJoin = async () => {
    if (!code.trim()) {
      setError("กรุณากรอกรหัสห้องเรียน");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/classroom/joinClassroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (data.alreadyJoined) {
        alert("คุณอยู่ในห้องเรียนนี้แล้ว");
        onClose();
        return;
      }

      if (res.ok && data.success) {
        alert(`เข้าร่วมห้อง ${data.name} สำเร็จ!`);
        onJoin?.(code.trim());
        onClose();
        window.location.reload(); // ถ้าต้องการ reload หน้า
        return;
      }

      setError(data.error || "เข้าร่วมห้องไม่สำเร็จ");
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
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter Class Code"
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
                onClick={handleJoin}
                disabled={!code.trim() || loading}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-md enabled:hover:opacity-90 disabled:opacity-40"
              >
                {loading ? "Joining..." : "Join"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
