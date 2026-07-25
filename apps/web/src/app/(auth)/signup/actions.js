"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
export async function signup(formData) {
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    try {
        await auth.api.signUpEmail({
            body: { email, password, name },
            headers: await headers(),
        });
    }
    catch {
        redirect("/signup?error=signup-failed");
    }
    revalidatePath("/admin", "layout");
    redirect("/admin");
}
