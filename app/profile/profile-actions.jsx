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