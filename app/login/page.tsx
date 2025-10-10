"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebaseClient";
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup
} from "firebase/auth";
import { provider } from "@/lib/firebaseClient";
import { loginUser } from "./login";
import { 
  VALIDATE_INPUT,
  getFirebaseErrorMessage,
} from "./loginConstant";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!email || !password) {
      setErr(VALIDATE_INPUT);
      return;
    }

    try {
      setLoading(true);

      // Step 1: Sign in with Firebase Client SDK
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Step 2: Get ID token
      const idToken = await userCredential.user.getIdToken();

      // Step 3: Call server action to create session
      const result = await loginUser(email, password, idToken);

      if (!result.success) {
        setErr(result.error || "Login failed");
        return;
      }

      // Show success message
      setMsg(result.message || "Login successful!");
      
      // Wait a bit longer for cookie to be set, then redirect
      setTimeout(() => {
        router.push("/profile");
        router.refresh(); // Force refresh to load new session
      }, 1000);
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Use centralized error handling
      const errorMessage = error?.code 
        ? getFirebaseErrorMessage(error.code)
        : error?.message || "Login failed";

      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    setErr(null);
    setMsg(null);
    
    if (!email) {
      setErr("Please enter your email first, then click Forgot Password");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset link sent to your email!");
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      // Use centralized error handling
      const errorMessage = error?.code 
        ? getFirebaseErrorMessage(error.code)
        : error?.message || "Failed to send reset email";
      
      setErr(errorMessage);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-zinc-900 flex items-center justify-center py-8">
      <section className="w-full max-w-[480px] sm:max-w-[560px] px-4">
        <div className="bg-zinc-200 rounded-2xl shadow-lg p-6 sm:p-8 max-h-[95vh] overflow-y-auto">
          <h1 className="font-mono text-4xl font-extrabold text-center mb-6 text-zinc-800">
            Login
          </h1>

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
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="font-mono text-lg font-bold text-zinc-900">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-md border border-zinc-300 text-black bg-white px-4 py-2 outline-none focus:ring focus:ring-zinc-400"
                placeholder="Type your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="font-mono text-lg font-bold text-zinc-900">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border border-zinc-300 text-black bg-white px-4 py-2 outline-none focus:ring focus:ring-zinc-400"
                placeholder="Type your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onForgot}
                disabled={loading}
                className="text-sm text-zinc-700 hover:underline disabled:opacity-50"
              >
                Forgot Password?
              </button>
            </div>

            {err && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{err}</p>
              </div>
            )}
            
            {msg && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-green-700 text-sm">{msg}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-36 mx-auto block rounded-md bg-amber-900 hover:bg-amber-800 text-white font-mono text-xl py-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Loading..." : "Log in"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-zinc-400"></div>
            <span className="text-zinc-600 text-sm font-mono px-2">OR</span>
            <div className="flex-1 h-px bg-zinc-400"></div>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 border-2 border-zinc-300 rounded-lg py-3 px-4 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6">
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
              <span className="font-semibold text-zinc-700 text-base">
                {loading ? "Signing in..." : "Continue with Google"}
              </span>
            </button>
          </div>

          <div className="text-center mt-6 text-zinc-700">
            <span className="font-mono">Create an account</span>
            <span className="mx-2">•</span>
            <Link 
              href="/register" 
              className="underline hover:no-underline text-amber-900 hover:text-amber-700"
            >
              Register
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}