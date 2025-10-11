import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  
  if (!session) {
    redirect("/login");
  }

  try {
    // Verify session and get user data
    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    const uid = decodedClaims.uid;

    // Get user data from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();

    const handleLogout = async () => {
      'use server';
      const cookieStore = await cookies();
      cookieStore.delete("session");
      redirect("/login");
    };

    return (
      <main className="min-h-screen bg-gray-100 flex flex-col">
        {/* Header */}
        <header className="bg-black text-white p-6">
          <h1 className="text-2xl font-bold">Profile</h1>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">
          {/* Profile Section */}
          <Link 
            href="/profile/edit"
            className="bg-white rounded-lg p-6 mb-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Profile Picture */}
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center overflow-hidden">
                {userData?.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>

              <div>
                <p className="text-gray-600">{userData?.name || "Not set"}</p>
              </div>
            </div>

            {/* Arrow */}
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Info Display */}
          <div className="bg-white rounded-lg p-6 mb-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-1">Fullname</h3>
              <p className="text-gray-600">{userData?.name || "Not set"}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-1">Email</h3>
              <p className="text-gray-600">{userData?.email || "N/A"}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-4">
            <Link
              href="/classroom"
              className="bg-gray-300 hover:bg-gray-400 transition-colors rounded-lg p-4 flex items-center gap-3 font-semibold"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              Classroom
            </Link>

            <Link
              href="/settings"
              className="bg-gray-300 hover:bg-gray-400 transition-colors rounded-lg p-4 flex items-center gap-3 font-semibold"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
              Setting
            </Link>
          </div>

          {/* Logout Button */}
          <form action={handleLogout}>
            <button
              type="submit"
              className="w-full bg-red-900 hover:bg-red-800 transition-colors text-white rounded-lg p-4 font-semibold"
            >
              Log out
            </button>
          </form>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Profile error:", error);
    redirect("/login");
  }
}