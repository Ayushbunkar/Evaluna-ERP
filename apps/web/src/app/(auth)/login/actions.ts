"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const rememberMe = formData.get("rememberMe") === "on";

  let user: any = null;

  try {
    const res = await auth.api.signInEmail({
      body: { 
        email, 
        password,
        rememberMe,
      },
      headers: await headers(),
    });
    
    user = res.user;
  } catch (err: any) {
    console.error("Login Server Action Error:", err);
    // Determine error type
    const msg = err.body?.message || "invalid-credentials";
    if (msg.includes("suspended")) {
      redirect("/login?error=suspended");
    } else if (msg.includes("locked")) {
      redirect("/login?error=locked");
    }
    redirect("/login?error=invalid-credentials");
  }

  if (user?.is_superadmin || !user?.branch_id) {
    redirect("/branch-select");
  }
  
  // Redirect based on role
  const role = user?.role || "sales_person";
  revalidatePath(`/${role === "sales_person" ? "sales" : role}`, "layout");
  redirect(`/${role === "sales_person" ? "sales" : role}`);
}

export async function logout() {
  await auth.api.signOut({
    headers: await headers(),
  });

  revalidatePath("/", "layout");
  redirect("/");
}
