import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";

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

    return (
      <main className="min-h-screen bg-zinc-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-800 rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold font-mono">Profile</h1>
              <LogoutButton />
            </div>

            <div className="space-y-6">
              {/* Profile Picture */}
              {userData?.photoURL && (
                <div className="flex justify-center mb-6">
                  <img
                    src={userData.photoURL}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-amber-900"
                  />
                </div>
              )}

              {/* User Info */}
              <div className="grid grid-cols-[200px_1fr] gap-4 bg-zinc-700 p-6 rounded-lg">
                <div className="font-bold text-amber-500">User ID:</div>
                <div className="font-mono text-sm break-all">{uid}</div>

                <div className="font-bold text-amber-500">Email:</div>
                <div>{userData?.email || "N/A"}</div>

                {userData?.name && (
                  <>
                    <div className="font-bold text-amber-500">Name:</div>
                    <div>{userData.name}</div>
                  </>
                )}

                <div className="font-bold text-amber-500">Login Provider:</div>
                <div className="capitalize">{userData?.provider || "email"}</div>

                <div className="font-bold text-amber-500">Created At:</div>
                <div>
                  {userData?.createdAt
                    ? new Date(userData.createdAt).toLocaleString()
                    : "N/A"}
                </div>

                <div className="font-bold text-amber-500">Last Login:</div>
                <div>
                  {userData?.lastLogin
                    ? new Date(userData.lastLogin).toLocaleString()
                    : "N/A"}
                </div>
              </div>

              {/* Success Message */}
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
                <p className="text-green-400 font-semibold">
                  ✅ You are successfully logged in!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Profile error:", error);
    redirect("/login");
  }
}