"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    photoURL: "",
  });

  // ✅ เมื่อแก้ Fullname
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, fullName: e.target.value });
  };

  // ✅ ฟังก์ชันบันทึกข้อมูล
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: "cWFO4h8PCGhkOHIxIcP4qYgCrUg1", // 🔧 (ภายหลังจะดึงจาก verify API)
        displayName: form.fullName,
        fullName: form.fullName,
        photoURL: form.photoURL,
      }),
    });

    alert("✅ Profile updated successfully!");
    router.push("/profile"); // ✅ กลับไปหน้าโปรไฟล์
  };

  // ✅ ปุ่มออก (กลับโดยไม่บันทึก)
  const handleCancel = () => {
    if (confirm("Discard changes and return to profile?")) {
      router.push("/profile");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-10">
      <div
        className="
        bg-white rounded-2xl shadow-lg 
        p-6 sm:p-8 md:p-10
        w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl
        text-center
        transition-all duration-300
      "
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
          Edit Profile
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-4">
            <div
              className="
              w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32
              rounded-full bg-gray-300 flex items-center justify-center overflow-hidden
            "
            >
              {form.photoURL ? (
                <img
                  src={form.photoURL}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-12 h-12 text-white sm:w-14 sm:h-14"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>

            <button
              type="button"
              className="text-sm mt-3 text-gray-500 hover:text-black transition"
            >
              Upload Photo
            </button>
          </div>

          {/* Fullname */}
          <div className="text-left">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Fullname
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={handleFullNameChange}
              className="
                border border-gray-300 focus:border-black focus:ring-1 focus:ring-black
                p-2.5 rounded-md w-full text-gray-800
                transition
              "
              placeholder="Enter your full name"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-5">
            <button
              type="submit"
              className="
                flex-1 bg-black text-white py-2.5 rounded-lg 
                hover:bg-gray-800 transition font-semibold
              "
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="
                flex-1 bg-gray-300 text-gray-800 py-2.5 rounded-lg 
                hover:bg-gray-400 transition font-semibold
              "
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
