import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { uid, displayName, photoURL } = await req.json();
    if (!uid) {
      return new Response(JSON.stringify({ error: "Missing UID" }), { status: 400 });
    }

    let targetUid = uid;

    // 1️⃣ Check if this UID exists in Firestore
    const existingDoc = await adminDb.collection("users").doc(uid).get();

    if (!existingDoc.exists) {
      // 2️⃣ Try to get the user email from Firebase Auth
      const firebaseUser = await adminAuth.getUser(uid).catch(() => null);
      const email = firebaseUser?.email;

      // 3️⃣ Find linked account with this email
      if (email) {
        const linkedSnap = await adminDb
          .collection("users")
          .where("googleEmail", "==", email)
          .limit(1)
          .get();

        if (!linkedSnap.empty) {
          targetUid = linkedSnap.docs[0].id; // ✅ Use the existing linked UID
        }
      }
    }

    // 4️⃣ Now update or create on the correct UID
    const userRef = adminDb.collection("users").doc(targetUid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      await userRef.update({
        displayName,
        photoURL,
        updatedAt: new Date(),
      });
    } else {
      await userRef.set({
        uid: targetUid,
        displayName,
        photoURL,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "user",
      });
    }

    return new Response(
      JSON.stringify({ success: true, uid: targetUid }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Profile update failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update profile" }),
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return new Response(JSON.stringify({ error: "Missing UID" }), { status: 400 });
  }

  let targetUid = uid;

  const userDoc = await adminDb.collection("users").doc(uid).get();

  if (!userDoc.exists) {
    // fallback lookup by Google email
    const firebaseUser = await adminAuth.getUser(uid).catch(() => null);
    const email = firebaseUser?.email;

    if (email) {
      const linkedSnap = await adminDb
        .collection("users")
        .where("googleEmail", "==", email)
        .limit(1)
        .get();

      if (!linkedSnap.empty) {
        targetUid = linkedSnap.docs[0].id;
      }
    }
  }

  const doc = await adminDb.collection("users").doc(targetUid).get();

  if (!doc.exists) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  const data = doc.data();
  return new Response(
    JSON.stringify({
      displayName: data?.displayName || "",
      photoURL: data?.photoURL || "",
      uid: targetUid,
    }),
    { status: 200 }
  );
}
