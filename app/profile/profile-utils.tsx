import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * ✅ ตรวจสอบ session แล้วคืนค่า UID ของผู้ใช้ที่ล็อกอิน
 * - ถ้า login ด้วย Google และมีการเชื่อมบัญชีไว้ → คืน UID ของบัญชีหลัก (email/password)
 */
export async function getVerifiedUserId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");
    
    if (!session) {
      console.log("No session found → redirect to login");
      redirect("/login");
    }

    console.log("🔍 Verifying session cookie...");
    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    let uid = decodedClaims.uid;
    console.log("✅ Session verified for UID:", uid);

    const authUser = await adminAuth.getUser(uid);
    const signInProvider = decodedClaims.firebase?.sign_in_provider;
    console.log("Sign-in provider:", signInProvider);

    // 🧩 ถ้า login ด้วย Google → ตรวจสอบว่ามีบัญชีที่ link อยู่ไหม
    if (signInProvider === "google.com") {
      const googleEmail = authUser.email?.toLowerCase();
      console.log("Google sign-in detected:", googleEmail);

      if (!googleEmail) {
        console.log("No email found in Google auth user");
        cookieStore.delete("session");
        redirect("/login");
      }

      // 🔎 หา user จาก googleEmail ก่อน
      let linkedAccountSnapshot = await adminDb
        .collection("users")
        .where("googleEmail", "==", googleEmail)
        .where("googleLinked", "==", true)
        .limit(1)
        .get();

      if (!linkedAccountSnapshot.empty) {
        const linkedDoc = linkedAccountSnapshot.docs[0];
        uid = linkedDoc.id;
        console.log("✅ Found linked account via googleEmail:", uid);
      } else {
        // ลองหาอีกรอบจาก email ปกติ
        linkedAccountSnapshot = await adminDb
          .collection("users")
          .where("email", "==", googleEmail)
          .limit(1)
          .get();

        if (!linkedAccountSnapshot.empty) {
          const linkedDoc = linkedAccountSnapshot.docs[0];
          const linkedData = linkedDoc.data();

          if (linkedData.googleLinked === true && linkedData.googleEmail) {
            uid = linkedDoc.id;
            console.log("✅ Found linked account via email:", uid);
          } else {
            console.log("⚠️ Google account not linked, redirecting...");
            cookieStore.delete("session");
            redirect("/login");
          }
        } else {
          console.log("No linked account found → using Google UID:", uid);
        }
      }
    }

    return uid;
  } catch (error: any) {
    console.error("❌ Error in getVerifiedUserId:", error);
    throw error;
  }
}

/**
 * ✅ ดึงข้อมูลผู้ใช้ทั้งจาก Firebase Auth และ Firestore
 */
export async function getUserData(uid: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");
    
    if (!session) {
      console.log("No session found → redirect to login");
      redirect("/login");
    }

    console.log("📦 Getting user data for UID:", uid);
    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    const signInProvider = decodedClaims.firebase?.sign_in_provider;
    const tokenUid = decodedClaims.uid;

    // 🔸 ดึงข้อมูลจาก Firebase Auth
    const authUser = await adminAuth.getUser(uid);
    console.log("Got auth user:", authUser.uid);

    // 🔸 ดึงข้อมูลจาก Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) throw new Error("User data not found in Firestore");
    const userData = userDoc.data();
    console.log("Got user data from Firestore");

    // 🔎 ตรวจสอบสถานะการเชื่อมบัญชี
    const isLinkedAccountSession = signInProvider === "google.com" && tokenUid !== uid;
    const isGoogleLinked = userData?.googleLinked || false;
    const googleEmail = userData?.googleEmail || null;
    const isGoogleSignIn = signInProvider === "google.com" && !isLinkedAccountSession;

    console.log("Auth check:", {
      signInProvider,
      tokenUid,
      profileUid: uid,
      isLinkedAccountSession,
      isGoogleSignIn,
      isGoogleLinked,
    });

    return {
      authUser,
      userData,
      isGoogleSignIn,
      isGoogleLinked,
      googleEmail,
      signInProvider,
    };
  } catch (error: any) {
    console.error("❌ Error in getUserData:", error);
    throw error;
  }
}

/* ============================================================
   ✅ Utility Functions (DisplayName / Fullname / Email / Photo)
   ============================================================ */

/**
 * Username → ใช้ displayName จาก Firestore ก่อน
 */
export function getDisplayName(userData: any, authUser: any): string {
  const result =
    userData?.displayName ||
    authUser?.displayName ||
    userData?.fullname ||
    userData?.email?.split("@")[0] ||
    "User";

  console.log("🪪 getDisplayName →", result);
  return result;
}

/**
 * Fullname → ใช้ fullname จาก Firestore ก่อน
 */
export function getFullName(userData: any, authUser: any): string {
  const result =
    userData?.fullname ||
    userData?.displayName ||
    authUser?.displayName ||
    "";

  console.log("👤 getFullName →", result);
  return result;
}

/**
 * Email → ดึงจาก Firestore ก่อน ถ้าไม่มีใช้ของ Auth
 */
export function getEmail(userData: any, authUser: any): string {
  const result = userData?.email || authUser?.email || "N/A";
  return result;
}

/**
 * Photo → ดึงจาก Firestore ก่อน ถ้าไม่มีใช้ของ Auth
 */
export function getPhotoURL(userData: any, authUser: any): string | null {
  const result = userData?.photoURL || authUser?.photoURL || null;
  return result;
}

/**
 * Logout → ลบ session cookie แล้ว redirect ไป /login
 */
export async function handleLogout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
