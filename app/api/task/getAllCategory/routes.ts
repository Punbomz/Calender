// app/api/task/getcategory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin"; // ใช้ Firebase Admin สำหรับ Server Side

export async function GET(req: NextRequest) {
  try {
    // ดึงข้อมูลทั้งหมดจาก collection "category"
    const snapshot = await adminDb.collection("category").get();

    // แปลงเป็น array
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories", details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
