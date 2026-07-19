"use client";

import { signup } from "./actions";
import { Card, CardContent, CardFooter } from "@evaluna/ui/components/card";
import { Label } from "@evaluna/ui/components/label";
import { Input } from "@evaluna/ui/components/input";
import Link from "next/link";
import { Button } from "@evaluna/ui/components/button";
import { MountainIcon, AlertCircle, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";

function SignupForm() {
  const t = useTranslations("signup");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, setIsPending] = useState(false);

  const errorMessage =
    error === "signup-failed"
      ? "Registration failed. The email may already be in use, or the password is too weak (min 8 characters)."
      : error === "email-exists"
      ? "An account with this email already exists. Please log in instead."
      : null;

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    await signup(formData);
    // signup redirects on success, so we only reach here on client-side issues
    setIsPending(false);
  }

  return (
    <form ref={formRef} action={handleSubmit}>
      <CardContent className="space-y-4 mt-4">
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder={t("namePlaceholder")}
            required
            autoComplete="name"
            minLength={2}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            required
            autoComplete="email"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={t("passwordPlaceholder")}
            minLength={8}
            required
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending ? "Creating account..." : t("submit")}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            {t("logIn")}
          </Link>
        </p>
      </CardFooter>
    </form>
  );
}

export default function SignupPage() {
  const t = useTranslations("signup");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-primary/10 rounded-2xl mb-2">
            <MountainIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Card>
          <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>}>
            <SignupForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
