"use client";

import { useState } from "react";
import { storage } from "@/lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditProfilePage() {
  const [uid] = useState("IpcNi12kwVfHcsVyIuxGyaG76HC3"); // test UID
  const [username, setUsername] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  const handleUploadPhoto = async () => {
    if (!photo) return null;

    const photoRef = ref(storage, `profile_photos/${uid}/${photo.name}`);
    await uploadBytes(photoRef, photo);
    const downloadURL = await getDownloadURL(photoRef);
    return downloadURL;
  };

  const handleSave = async () => {
    try {
      setStatus("⏳ Uploading...");
      const photoURL = photo ? await handleUploadPhoto() : null;

      setStatus("⏳ Saving profile...");
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          displayName: username,
          photoURL,
        }),
      });

      const data = await res.json();
      if (res.ok) setStatus("✅ Profile updated successfully!");
      else setStatus("❌ Error: " + data.error);
    } catch (err: any) {
      console.error(err);
      setStatus("❌ " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow p-6">
        <h1 className="text-xl font-bold mb-4 text-center">Edit Profile</h1>

        <div className="flex flex-col items-center mb-4">
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-5xl">
            👤
          </div>

          <label className="mt-2 text-sm font-medium bg-gray-200 px-3 py-1 rounded cursor-pointer hover:bg-gray-300">
            Upload Photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        <label className="font-semibold text-sm">Username</label>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border rounded w-full p-2 mb-3"
        />

        <div className="flex justify-between">
          <button
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>

          <button
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            onClick={handleSave}
          >
            Save
          </button>
        </div>

        {status && <p className="mt-4 text-center text-sm">{status}</p>}
      </div>
    </div>
  );
}
