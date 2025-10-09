import { auth, db } from "@/lib/firebaseClient";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {passwordValidation, validateEmail, checkEmailExists} from "./RegisterHelper";
import { EMAIL_INVALID_MESSAGE, EMAIL_ALREADY_IN_USE_MESSAGE } from "./registerConstant";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function registerUser(
  displayName: string,
  email: string,
  password: string,
  confirmPassword: string
) {
  // Validate Password
  passwordValidation(password, confirmPassword);
    // Validate Email
    if (!validateEmail(email)) {
        throw new Error(EMAIL_INVALID_MESSAGE);
    }
    if (await checkEmailExists(email)) {
        return alert(EMAIL_ALREADY_IN_USE_MESSAGE);
}
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update Profile
    await updateProfile(user, {
        displayName,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayName.charAt(0)
        )}&background=random`,
    });

    // Save user info to Firestore
    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: displayName,
        email: email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        role: "user", // Default role
    });

  return user;
}


