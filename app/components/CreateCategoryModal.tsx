"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate?: (name: string) => void;
  title?: string;
}

export default function CreateCategoryModal({
  open,
  onClose,
  onCreate,
  title = "Create Category",
}: Props) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

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
    };
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/task/createTag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tagName: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create category");
        return;
      }

      onCreate?.(trimmed);
      onClose();
    } catch (err) {
      console.error("Error creating category:", err);
      setError("Failed to create category. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 "
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative mx-4 w-full max-w-sm rounded-2xl bg-[#4d3028] p-6 shadow-2xl "
            initial={{ y: 24, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <button
              onClick={onClose}
              className="absolute right-2 top-2 text-white/80 hover:text-white"
            >
              ×
            </button>

            <h2 className="mb-4 text-center text-xl font-semibold text-white">
              {title}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category Name"
                className="w-full rounded-full bg-white px-4 py-2 text-sm text-gray-900 shadow-inner outline-none ring-2 ring-transparent focus:ring-white/60"
              />
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-4 py-2 text-sm text-white/80 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || isLoading}
                  className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white shadow-md enabled:hover:opacity-90 disabled:opacity-40"
                >
                  {isLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}