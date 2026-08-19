"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { signIn, signOut } from "@/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    unstable_rethrow(error);
    redirect("/login?error=1");
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
