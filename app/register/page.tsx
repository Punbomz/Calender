"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "./register";

export default function RegisterPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullname, setFullname] = useState("");

  // Image upload
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

    // Basic validation
    if (!email || !password || !confirm || !fullname) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      // Call the register function with the image file
      await registerUser(fullname, email, password, confirm, file);

      // Success - redirect to profile
      router.push("/profile");
    } catch (err: any) {
      // Handle errors from registerUser
      setError(err?.message || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-zinc-900 flex items-center justify-center">
      <section className="w-full px-4">
        <div className="mx-auto w-full max-w-[520px] bg-zinc-200 rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="font-mono text-4xl font-extrabold text-center mb-8 text-zinc-800">
            Register
          </h1>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="font-mono text-lg font-bold text-zinc-900">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 outline-none focus:ring focus:ring-zinc-400"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="font-mono text-lg font-bold text-zinc-900">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 outline-none focus:ring focus:ring-zinc-400"
                placeholder="Min 6 chars, A-Z, a-z, 0-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Confirm Password */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="font-mono text-lg font-bold text-zinc-900 leading-tight">
                Confirm
                <br />
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 outline-none focus:ring focus:ring-zinc-400"
                placeholder="Retype your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            {/* Fullname */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="font-mono text-lg font-bold text-zinc-900">
                Full Name
              </label>
              <input
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 outline-none focus:ring focus:ring-zinc-400"
                placeholder="John Doe"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
              />
            </div>

            {/* Upload */}
            <div className="pt-2">
              {preview && (
                <div className="mb-3 flex items-center gap-3">
                  <img
                    src={preview}
                    alt="preview"
                    className="w-12 h-12 rounded-full object-cover border border-zinc-300"
                  />
                  <span className="text-sm text-zinc-600">
                    Profile Picture Preview
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
            {error && <p className="text-red-600 text-sm pt-1">{error}</p>}

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-36 mx-auto block rounded-md bg-amber-900 hover:bg-amber-800 text-white font-mono text-xl py-2 disabled:opacity-60 transition"
              >
                {submitting ? "Loading..." : "Sign Up"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
