"use client";

import { db } from "@/lib/firebaseClient";
import { deleteDoc, doc } from "firebase/firestore";

export type Task = {
  id: string;
  title: string;
  // เติมฟิลด์อื่นที่คุณมีได้ เช่น detail, dueDate, status, ownerId ...
};

export async function deleteTaskById(taskId: string) {
  await deleteDoc(doc(db, "tasks", taskId));
}
