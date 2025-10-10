"use client";

import { auth } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // Sign out from Firebase client
      await signOut(auth);

      // Clear session cookie by calling logout API
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if there's an error
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all disabled:opacity-60"
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}