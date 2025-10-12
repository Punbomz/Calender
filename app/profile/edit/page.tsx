"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ form state — แยก field ชัดเจน
  const [form, setForm] = useState({
    displayName: "",
    fullname: "",
    photoURL: "",
  });

  // ----------------------------
  // STEP 1: verify uid
  // ----------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/verify");
        const data = await res.json();
        if (!data?.success || !data?.uid) {
          router.replace("/login");
          return;
        }

        setUid(data.uid);

        // ✅ STEP 2: preload profile data
        const profileRes = await fetch(`/api/profile?uid=${data.uid}`);
        if (profileRes.ok) {
          const p = await profileRes.json();
          setForm({
            displayName: p.displayName ?? "",
            fullname: p.fullname ?? "",
            photoURL: p.photoURL ?? "",
          });
        }
      } catch (err) {
        console.error("Error verifying user:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // ----------------------------
  // STEP 3: update handlers
  // ----------------------------
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, displayName: e.target.value }));

  const handleFullnameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, fullname: e.target.value }));

  const handlePhotoClick = () => {
    const link = prompt("ใส่ลิงก์รูปโปรไฟล์ (https://...)");
    if (link) setForm((prev) => ({ ...prev, photoURL: link }));
  };

  // optional file upload (local preview)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const localURL = URL.createObjectURL(f);
    setForm((prev) => ({ ...prev, photoURL: localURL }));
  };

  // ----------------------------
  // STEP 4: submit update
  // ----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          displayName: form.displayName,
          fullname: form.fullname,
          photoURL: form.photoURL,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Update failed");

      alert("✅ Profile updated successfully!");
      router.push("/profile");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("❌ Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <main className="min-h-screen bg-gray-300 flex items-center justify-center">
        <div className="text-gray-700">Loading...</div>
      </main>
    );

  // ----------------------------
  // STEP 5: render UI (Figma style)
  // ----------------------------
  return (
    <main className="min-h-screen bg-gray-300 flex items-center justify-center">
      <div className="w-[360px] bg-gray-200 rounded-lg overflow-hidden shadow-md">
        <div className="bg-black text-white text-center py-4">
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col items-center">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gray-400 flex items-center justify-center mb-2 overflow-hidden">
            {form.photoURL ? (
              <img
                src={form.photoURL}
                alt="avatar"
                className="w-24 h-24 object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
              </svg>
            )}
          </div>

          <button
            type="button"
            onClick={handlePhotoClick}
            className="bg-gray-400 text-xs text-white px-3 py-1 rounded-full mb-6 hover:bg-gray-500"
          >
            upload photo
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Username */}
          <div className="w-full mb-3">
            <label className="block text-sm font-bold mb-1 text-gray-800">
              Username
            </label>
            <input
              type="text"
              placeholder="Username"
              value={form.displayName}
              onChange={handleDisplayNameChange}
              className="w-full p-2 rounded-md border border-gray-400 focus:outline-none bg-white"
            />
          </div>

          {/* Fullname */}
          <div className="w-full mb-6">
            <label className="block text-sm font-bold mb-1 text-gray-800">
              Fullname
            </label>
            <input
              type="text"
              placeholder="Fullname"
              value={form.fullname}
              onChange={handleFullnameChange}
              className="w-full p-2 rounded-md border border-gray-400 focus:outline-none bg-white"
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
              disabled={saving}
              className="bg-black text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
