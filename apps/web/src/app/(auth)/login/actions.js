"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
export async function login(formData) {
    const email = formData.get("email");
    const password = formData.get("password");
    try {
        await auth.api.signInEmail({
            body: { email, password },
            headers: await headers(),
        });
    }
    catch {
        redirect("/login?error=invalid-credentials");
    }
    revalidatePath("/admin", "layout");
    redirect("/admin");
}
export async function logout() {
    await auth.api.signOut({
        headers: await headers(),
    });
    revalidatePath("/", "layout");
    redirect("/");
}
