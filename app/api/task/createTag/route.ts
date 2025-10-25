import { adminDb } from "@/lib/firebaseAdmin";

// POST /api/task/createTag
export async function POST(req: Request) {
  try {
    const { tagName } = await req.json();

    if (!tagName) {
      return new Response(JSON.stringify({ error: "Missing tagName" }), { status: 400 });
    }

    const tagRef = adminDb.collection("tag").doc(tagName);

    // Create new tag
    await tagRef.set({
        tagName,
        createdAt: new Date(),
        updatedAt: new Date(),
    });


    return new Response(
      JSON.stringify({ success: true, tagName }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Tag creation failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create tag" }),
      { status: 500 }
    );
  }
}

