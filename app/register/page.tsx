"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, storage } from "@/lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function RegisterPage() {
  const router = useRouter();

  // ฟอร์มสเตต
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");

  // อัปโหลดรูป
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // UI states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPickImage = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ตรวจสอบความถูกต้องเบื้องต้น
    if (!email || !password || !confirm || !username || !fullname) {
      setError("กรอกข้อมูลให้ครบทุกช่องก่อนนะ");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านควรอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      setSubmitting(true);

      // 1) สมัครสมาชิก
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 2) ถ้ามีไฟล์รูป ให้ส่งขึ้น Storage แล้วได้ URL มา
      let photoURL: string | undefined = undefined;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const avatarRef = storageRef(
          storage,
          `avatars/${cred.user.uid}.${ext}`
        );
        await uploadBytes(avatarRef, file);
        photoURL = await getDownloadURL(avatarRef);
      }

      // 3) อัพเดตโปรไฟล์ (displayName ใช้ fullname หรือ username ก็ได้)
      await updateProfile(cred.user, {
        displayName: fullname || username,
        photoURL,
      });

      // 4) เสร็จแล้วพาไปหน้าโปรไฟล์/หน้าหลัก
      router.push("/profile");
    } catch (err: any) {
      // ข้อความ error จาก Firebase มักจะมี code เช่น "auth/email-already-in-use"
      const msg =
        err?.code === "auth/email-already-in-use"
          ? "อีเมลนี้ถูกใช้สมัครแล้ว"
          : err?.message || "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-zinc-800 text-zinc-900">
      {/* กล่องเทาอ่อนตามภาพ */}
      <section className="max-w-md mx-auto px-4 pt-6 pb-10">
        <div className="bg-zinc-200 rounded-md shadow p-6 sm:p-8">
          <h1 className="font-mono text-3xl font-extrabold text-center mb-8">
            Register
          </h1>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email */}
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <label className="font-mono text-lg">Email</label>
              <input
                type="email"
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 outline-none focus:ring focus:ring-zinc-400"
                placeholder="Type your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <label className="font-mono text-lg">Password</label>
              <input
                type="password"
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 outline-none focus:ring"
                placeholder="Type your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Confirm Password */}
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <label className="font-mono text-lg leading-tight">
                Confirm<br/>Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 outline-none focus:ring"
                placeholder="Type your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            {/* Username */}
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <label className="font-mono text-lg">Username</label>
              <input
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 outline-none focus:ring"
                placeholder="Type your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Fullname */}
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <label className="font-mono text-lg">Fullname</label>
              <input
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 outline-none focus:ring"
                placeholder="Type your fullname"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
              />
            </div>

            {/* Upload Profile Picture */}
            <div className="pt-2">
              {preview && (
                <div className="mb-3 flex items-center gap-3">
                  <img
                    src={preview}
                    alt="preview"
                    className="w-12 h-12 rounded-full object-cover border border-zinc-300"
                  />
                  <span className="text-sm text-zinc-600">
                    ตัวอย่างรูปโปรไฟล์
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={onPickImage}
                className="w-full rounded-md bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-semibold py-3 transition"
              >
                Upload Profile Picture
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-600 text-sm pt-1">{error}</p>
            )}

            {/* ปุ่ม Register / Sign in style ตามภาพ (ปุ่มน้ำตาล) */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-32 mx-auto block rounded-md bg-amber-900 hover:bg-amber-800 text-white font-mono text-xl py-2 disabled:opacity-60"
              >
                {submitting ? "Loading..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
