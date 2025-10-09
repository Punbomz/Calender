"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebaseClient";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!email || !password) {
      setErr("กรอกอีเมลและรหัสผ่านให้ครบก่อนนะ");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/profile");
    } catch (error: any) {
      const message =
        error?.code === "auth/invalid-credential"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : error?.message || "เข้าสู่ระบบไม่สำเร็จ";
      setErr(message);
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    setErr(null);
    setMsg(null);
    if (!email) {
      setErr("กรอกอีเมลในช่อง Email ก่อน แล้วกด Forgot Password?");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว");
    } catch (error: any) {
      setErr(error?.message || "ส่งอีเมลรีเซ็ตไม่สำเร็จ");
    }
  };

  return (
    // พื้นหลังเต็มจอ + กึ่งกลาง
    <main className="min-h-[100dvh] bg-zinc-900 flex items-center justify-center">
      <section className="w-full max-w-[480px] sm:max-w-[560px] px-4">
        <div className="bg-zinc-200 rounded-2xl shadow-lg p-6 sm:p-8">
          <h1 className="font-mono text-4xl font-extrabold text-center mb-6 text-zinc-800">
            Login
          </h1>

          {/* ไอคอนโปรไฟล์แบบง่าย */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-white grid place-items-center border border-zinc-300">
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-zinc-700">
                <path
                  fill="currentColor"
                  d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5Zm0 2c-5.33 0-8 2.667-8 6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1c0-3.333-2.67-6-8-6Z"
                />
              </svg>
            </div>
          </div>

          <form onSubmit={onLogin} className="space-y-4">
            {/* Email */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="font-mono text-lg font-bold text-zinc-900">Email</label>
              <input
                type="email"
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 outline-none focus:ring focus:ring-zinc-400"
                placeholder="Type your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="font-mono text-lg font-bold text-zinc-900">Password</label>
              <input
                type="password"
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 outline-none focus:ring"
                placeholder="Type your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onForgot}
                className="text-sm text-zinc-700 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {err && <p className="text-red-600 text-sm">{err}</p>}
            {msg && <p className="text-green-700 text-sm">{msg}</p>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-36 mx-auto block rounded-md bg-amber-900 hover:bg-amber-800 text-white font-mono text-xl py-2 disabled:opacity-60"
              >
                {loading ? "Loading..." : "Log in"}
              </button>
            </div>
          </form>

          <div className="text-center mt-6 text-zinc-700">
            <span className="font-mono">Create an account</span>
            <span className="mx-2">•</span>
            <Link href="/register" className="underline hover:no-underline">
              Register
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
