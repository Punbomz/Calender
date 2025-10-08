"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, provider } from "@/lib/firebaseClient"
import { signInWithPopup, signInWithEmailAndPassword ,onAuthStateChanged, signOut, User } from "firebase/auth";


export default function LoginPage(){
    return (
        <div>
            Login Page
        </div>
    )
}