"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, storage } from "@/lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function RegisterRage(){
    return (
        <div>
            Register Page
        </div>
    )
}