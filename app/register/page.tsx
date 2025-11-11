"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, provider } from "@/lib/firebaseClient";
import { registerUser } from "./register";
import { loginUser } from "../login/login";
import { getFirebaseErrorMessage } from "../login/loginConstant";

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  const onGoogleLogin = async () => {
    setErr(null);
    setMsg(null);

    try {
      setLoading(true);

      // Use popup for Google sign-in
      const result = await signInWithPopup(auth, provider);

      // Get ID token
      const idToken = await result.user.getIdToken();

      // Call server action to create session
      const serverResult = await loginUser(
        result.user.email || "",
        "",
        idToken
      );

      if (!serverResult.success) {
        setErr(serverResult.error || "Login failed");
        setLoading(false);
        return;
      }

      // Show success message
      setMsg(serverResult.message || "Login successful!");

      // Redirect to profile
      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 1000);
    } catch (error: any) {
      console.error("Google login error:", error);

      // Use centralized error handling
      const errorMessage = error?.code
        ? getFirebaseErrorMessage(error.code)
        : error?.message || "Google login failed";

      setErr(errorMessage);
      setLoading(false);
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
                className="w-full rounded-md border border-zinc-300 text-black bg-white px-4 py-2 outline-none focus:ring focus:ring-zinc-400"
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
                className="w-full rounded-md border border-zinc-300 text-black bg-white px-4 py-2 outline-none focus:ring focus:ring-zinc-400"
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
                className="w-full rounded-md border border-zinc-300 text-black bg-white px-4 py-2 outline-none focus:ring focus:ring-zinc-400"
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
                className="w-full rounded-md border border-zinc-300 text-black bg-white px-4 py-2 outline-none focus:ring focus:ring-zinc-400"
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
                className="w-full rounded-md bg-red-600 hover:cursor-pointer hover:bg-red-700 active:scale-[0.99] text-white font-semibold py-3 transition"
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

            {/* Error Messages */}
            {error && <p className="text-red-600 text-sm pt-1">{error}</p>}
            {err && <p className="text-red-600 text-sm pt-1">{err}</p>}
            {msg && <p className="text-green-600 text-sm pt-1">{msg}</p>}

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-36 mx-auto block rounded-md bg-amber-900 hover:cursor-pointer hover:bg-amber-800 text-white font-mono text-xl py-2 disabled:opacity-60 transition"
              >
                {submitting ? "Loading..." : "Sign Up"}
              </button>
            </div>

            {/* Google Sign In */}
            <div className="pt-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-400"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-zinc-200 text-zinc-600">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-3 bg-white hover:cursor-pointer hover:bg-zinc-50 border-2 border-zinc-300 rounded-lg py-3 px-4 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-semibold text-zinc-700">
                  {loading ? "Signing in..." : "Sign in with Google"}
                </span>
              </button>
            </div>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-zinc-600 mt-6">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-amber-900 font-semibold hover:underline"
            >
              Login here
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
