"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);        // Firebase Auth UID
  const [realUid, setRealUid] = useState<string | null>(null); // Firestore UID
  const [form, setForm] = useState({
    displayName: "",
    photoURL: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const verifyRes = await fetch("/api/auth/verify");
        const verifyData = await verifyRes.json();

        if (!verifyData?.uid) {
          alert("Session expired. Please log in again.");
          router.push("/login");
          return;
        }

        setUid(verifyData.uid);

        // ✅ Fetch Firestore user data by UID
        const profileRes = await fetch(`/api/profile?uid=${verifyData.uid}`);
        const profileData = await profileRes.json();

        setRealUid(profileData.uid); // ✅ store Firestore UID
        setForm({
          displayName: profileData.displayName || "",
          photoURL: profileData.photoURL || "",
        });
      } catch (error) {
        console.error("Error loading profile:", error);
        alert("Failed to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // ✅ Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, displayName: e.target.value });
  };

  // ✅ Upload photo to the correct Firestore UID folder
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !realUid) return;

    setLoading(true);
    const fileRef = ref(storage, `profilePhotos/${realUid}/${file.name}`);

    try {
      const uploadSnap = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(uploadSnap.ref);
      setForm((prev) => ({ ...prev, photoURL: url }));
    } catch (err) {
      console.error("Upload failed:", err);
      alert("❌ Failed to upload photo.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save to the correct Firestore UID
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!realUid) return alert("User ID not found");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: realUid,
          displayName: form.displayName,
          photoURL: form.photoURL,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      alert("✅ Profile updated successfully!");
      router.push(`/profile?updated=${Date.now()}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("❌ Failed to update profile.");
    }
  };

  const handleExit = () => {
    if (confirm("Discard changes and return to your profile?")) {
      router.push("/profile");
    }
  };

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-10">
        <div className="animate-pulse bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center transition-all duration-300">
          <div className="h-24 w-24 bg-gray-300 rounded-full mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mt-3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto my-3"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center transition-all duration-300">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {form.photoURL ? (
                <img
                  src={form.photoURL}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 
                  1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 
                  1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              id="photoInput"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <label
              htmlFor="photoInput"
              className="text-sm mt-3 text-gray-500 hover:text-black cursor-pointer transition"
            >
              Upload Photo
            </label>
          </div>

          {/* Display Name */}
          <div className="text-left">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={handleNameChange}
              className="border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2.5 rounded-md w-full text-gray-800 transition"
              placeholder="Enter your display name"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-5">
            <button
              type="submit"
              className="flex-1 bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 transition font-semibold hover:cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleExit}
              className="flex-1 bg-gray-300 text-gray-800 py-2.5 rounded-lg hover:bg-gray-400 transition font-semibold hover:cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
