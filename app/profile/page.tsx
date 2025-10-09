"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";


export default function Profile(){
    return (
        <div>
            Profile
        </div>
    )
}