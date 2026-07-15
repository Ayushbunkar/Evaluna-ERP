"use client";

import { login } from "./actions";
import { Card, CardContent, CardFooter } from "@evaluna/ui/components/card";
import { Label } from "@evaluna/ui/components/label";
import { Input } from "@evaluna/ui/components/input";
import Link from "next/link";
import { Button } from "@evaluna/ui/components/button";
import { MountainIcon, AlertCircle } from "lucide-react";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("login");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const expired = searchParams.get("expired");
  const suspended = searchParams.get("suspended");

  function fillDemo() {
    if (emailRef.current) emailRef.current.value = "test@example.com";
    if (passwordRef.current) passwordRef.current.value = "test1234";
  }

  return (
    <form>
      <CardContent className="space-y-4 mt-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <p>
              {error === "locked"
                ? "Account locked due to too many failed attempts. Try again later."
                : error === "suspended"
                ? "Your account has been suspended."
                : "Invalid email or password."}
            </p>
          </div>
        )}
        {expired && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2 text-amber-500 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <p>Your session has expired. Please log in again.</p>
          </div>
        )}
        {suspended && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <p>Your account is currently suspended. Contact your administrator.</p>
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            required
            autoComplete="email"
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="rememberMe" name="rememberMe" className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-primary" />
          <Label htmlFor="rememberMe" className="text-sm font-normal text-muted-foreground cursor-pointer">Remember me for 30 days</Label>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button className="w-full" formAction={login}>
          {t("submit")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={fillDemo}
        >
          {t("fillDemo")}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href="/signup"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("signUp")}
          </Link>
        </p>
      </CardFooter>
    </form>
  );
}

export default function LoginPage() {
  const t = useTranslations("login");

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
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Card>
          <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
