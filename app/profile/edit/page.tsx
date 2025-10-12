"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: "",
    fullname: "",
    photoURL: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 📤 อัปโหลดหรือบันทึกผ่าน API
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: "USER_ID_HERE", // ✅ แทนด้วย uid จริง (หรือ auth.currentUser.uid)
          displayName: formData.displayName,
          fullname: formData.fullname,
          photoURL: formData.photoURL,
        }),
      });

      if (res.ok) {
        alert("✅ Profile updated successfully!");
        router.push("/profile");
      } else {
        const err = await res.json();
        alert("❌ " + err.error);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
  };

  // 📸 (ยังไม่เชื่อมอัปโหลดไฟล์จริง — mock ไว้ก่อน)
  const handlePhotoUpload = () => {
    const url = prompt("Enter photo URL:");
    if (url) setFormData({ ...formData, photoURL: url });
  };

  return (
    <main className="min-h-screen bg-gray-300 flex flex-col items-center justify-center">
      <div className="w-80 bg-gray-200 rounded-lg overflow-hidden shadow-md">
        {/* Header */}
        <div className="bg-black text-white text-center py-4">
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col items-center">
          {/* Profile Photo */}
          <div className="w-24 h-24 rounded-full bg-gray-400 flex items-center justify-center mb-2">
            {formData.photoURL ? (
              <img
                src={formData.photoURL}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A9 9 0 1118.364 4.56M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </div>

          <button
            type="button"
            onClick={handlePhotoUpload}
            className="bg-gray-400 text-sm text-white px-3 py-1 rounded-full mb-4 hover:bg-gray-500"
          >
            upload photo
          </button>

          {/* Username */}
          <div className="w-full mb-3">
            <label className="block text-sm font-bold mb-1 text-gray-800">
              Username
            </label>
            <input
              type="text"
              name="displayName"
              placeholder="Username"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full p-2 rounded-md border border-gray-400 focus:outline-none"
            />
          </div>

          {/* Fullname */}
          <div className="w-full mb-6">
            <label className="block text-sm font-bold mb-1 text-gray-800">
              Fullname
            </label>
            <input
              type="text"
              name="fullname"
              placeholder="Fullname"
              value={formData.fullname}
              onChange={handleChange}
              className="w-full p-2 rounded-md border border-gray-400 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex w-full justify-between">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="bg-white border border-black text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-black text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}






