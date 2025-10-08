"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";


export default function Pages(){
    return (
        <div>
            Register Page
        </div>
    )
}