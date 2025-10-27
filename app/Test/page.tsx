"use client";
import React, { useState } from "react";
import CreateCategoryModal from "../components/CreateCategoryModal";

export default function TestPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-black px-4 py-2 text-white shadow"
      >
        Add Category
      </button>

      <CreateCategoryModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={(name) => {
          console.log("Create category:", name);
          setOpen(false);
        }}
      />
    </div>
  );
}
