'use server';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Handles user logout
 */
export async function handleLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}

/**
 * Handles unlinking Google account - called after successful unlink
 */
export async function handleGoogleUnlink() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
/**
 * Handles updating user profile
 */
export async function updateUserProfile(formData) {
  try {
    const uid = await getVerifiedUserId(); // 🔑 UID ของผู้ใช้ที่ล็อกอิน

    const data = {
      fullname: formData.fullname || "",
      displayName: formData.displayName || "",
      email: formData.email || "",
      photoURL: formData.photoURL || "",
      updatedAt: new Date().toISOString(),
    };

    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      await updateDoc(userRef, data);
      console.log("✅ Updated existing profile:", uid, data);
    } else {
      await setDoc(userRef, data);
      console.log("🆕 Created new user profile:", uid, data);
    }

    return { success: true };
  } catch (error) {
    console.error("❌ updateUserProfile error:", error);
    return { success: false, error: error.message };
  }
}