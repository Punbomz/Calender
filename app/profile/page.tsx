import Link from "next/link";
import { redirect } from "next/navigation";
import GoogleLinkButton from "@/app/components/GoogleLinkButton";
import { cookies } from 'next/headers';
import {
  getVerifiedUserId,
  getUserData,
  getDisplayName,
  getFullName,
  getEmail,
  getPhotoURL,
} from "./profile-utils";
import { handleLogout } from "./profile-actions";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  try {
    // Get verified user ID (handles account linking logic)
    const uid = await getVerifiedUserId();
    const cookieStore = await cookies();

    // Get all user data
    const {
      authUser,
      userData,
      isGoogleSignIn,
      isGoogleLinked,
      googleEmail
    } = await getUserData(uid);

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
                {getPhotoURL(userData, authUser) ? (
                  <img
                    src={getPhotoURL(userData, authUser) || ""}
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
                <h2 className="text-xl text-black font-bold">{getDisplayName(userData, authUser)}</h2>
              </div>
            </div>

            {/* Arrow */}
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Info Display */}
          <div className="bg-white rounded-lg p-6 mb-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-1 text-black">Fullname</h3>

              <p className="text-gray-700">{getFullName(userData, authUser)}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-1 text-black">Email</h3>
              <p className="text-gray-700">{getEmail(userData, authUser)}</p>
            </div>
          </div>

          {/* Google Account Linking Section */}
          <div className="rounded-lg p-6 mb-4 bg-white">
            <h3 className="text-lg font-bold mb-3 text-black">Account Linking</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Google Icon */}
                <div className="w-10 h-10 border-2 rounded-full flex items-center justify-center bg-white border-gray-200">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>

                <div>
                  <p className="font-semibold text-black">Google Account</p>
                  {isGoogleSignIn && (
                    <p className="text-sm text-gray-700">Signed in with Google</p>
                  )}
                  {!isGoogleSignIn && isGoogleLinked && googleEmail && (
                    <p className="text-sm text-gray-700">{googleEmail}</p>
                  )}
                  {!isGoogleSignIn && !isGoogleLinked && (
                    <p className="text-sm text-gray-700">Not linked</p>
                  )}
                </div>
              </div>

              {/* Link/Unlink Button - Always show */}
              <GoogleLinkButton 
                isLinked={isGoogleLinked}
                userId={uid}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-4">
            <Link
              href="/classroom"
              className="bg-gray-300 hover:bg-gray-400 transition-colors rounded-lg p-4 flex items-center gap-3 font-semibold text-black"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              Classroom
            </Link>

            {/* <Link
              href="/settings"
              className="bg-gray-300 hover:bg-gray-400 transition-colors rounded-lg p-4 flex items-center gap-3 font-semibold text-black"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
              Setting
            </Link> */}
          </div>

          {/* Logout Button */}
          <form action={handleLogout}>
            <button
              type="submit"
              className="w-full bg-[#6a423a] hover:bg-[#593831] transition-colors text-white rounded-lg p-4 font-semibold hover:cursor-pointer"

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