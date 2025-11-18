import { auth, db, storage } from "@/lib/firebaseClient";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  passwordValidation,
  validateEmail,
  checkEmailExists,
} from "./RegisterHelper";
import { EMAIL_INVALID_MESSAGE } from "./registerConstant";

export async function registerUser(
  displayName: string,
  email: string,
  password: string,
  confirmPassword: string,
  profileImage?: File | null,
  role: "student" | "teacher" = "student"
) {
  // Validate Password
  passwordValidation(password, confirmPassword);

  // Validate Email
  if (!validateEmail(email)) {
    throw new Error(EMAIL_INVALID_MESSAGE);
  }

  if (await checkEmailExists(email)) {
    throw new Error("Email already in use");
  }

  // Create user account
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  console.log("User created with UID:", user.uid);

  // Handle profile image upload
  let photoURL: string;

  if (profileImage) {
    try {
      console.log("Uploading profile image...");
      // Upload custom image to Firebase Storage
      const ext = profileImage.name.split(".").pop() || "jpg";
      const avatarRef = storageRef(storage, `avatars/${user.uid}.${ext}`);
      await uploadBytes(avatarRef, profileImage);
      photoURL = await getDownloadURL(avatarRef);
      console.log("Image uploaded successfully:", photoURL);
    } catch (error) {
      console.error("Error uploading image:", error);
      // Fallback to default avatar if upload fails
      photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayName.charAt(0)
      )}&background=random`;
    }
  } else {
    // Use default avatar from UI Avatars
    photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName.charAt(0)
    )}&background=random`;
  }

  // Update Profile
  try {
    console.log("Updating user profile...");
    await updateProfile(user, {
      displayName,
      photoURL,
    });
    console.log("Profile updated successfully");
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update user profile");
  }

  // Save user info to Firestore with the new template
  try {
    console.log("Saving user data to Firestore...");
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      displayName: displayName,
      email: email,
      photoURL: photoURL,
      googleEmail: null, // No Google account linked initially
      googleLinked: false, // Not linked to Google
      lastLogin: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      role: role, // Default role
    });
    console.log("User data saved to Firestore successfully");
  } catch (error) {
    console.error("Error saving to Firestore:", error);
    throw new Error("Failed to save user data to database");
  }

  return user;
}