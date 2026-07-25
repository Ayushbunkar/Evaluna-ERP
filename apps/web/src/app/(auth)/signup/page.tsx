"use client";

import { signup } from "./actions";
import { Card, CardContent, CardFooter } from "@evaluna/ui/components/card";
import { Label } from "@evaluna/ui/components/label";
import { Input } from "@evaluna/ui/components/input";
import Link from "next/link";
import { Button } from "@evaluna/ui/components/button";
import { MountainIcon, AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { motion } from "framer-motion";

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
    setIsPending(false);
  }

  return (
    <form ref={formRef} action={handleSubmit}>
      <CardContent className="space-y-4 pt-6">
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{errorMessage}</p>
          </motion.div>
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
            className="transition-all focus-visible:ring-primary"
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
            className="transition-all focus-visible:ring-primary"
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
            className="transition-all focus-visible:ring-primary"
          />
          <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 pb-6">
        <Button className="w-full shadow-sm" type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isPending ? "Creating account..." : t("submit")}
        </Button>
        <p className="text-sm text-center text-muted-foreground mt-2">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-foreground font-medium underline-offset-4 hover:underline transition-colors">
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden selection:bg-primary/20">
      {/* Background gradients for premium feel */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="absolute top-6 right-6">
        <LocaleSwitcher />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto w-full max-w-md space-y-8 px-4"
      >
        <div className="flex flex-col items-center space-y-3 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="p-3 bg-secondary rounded-2xl mb-2 shadow-sm ring-1 ring-border"
          >
            <MountainIcon className="h-8 w-8 text-foreground" strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">{t("title")}</h2>
          <p className="text-base text-muted-foreground max-w-sm">
            {t("subtitle")}
          </p>
        </div>
        
        <Card className="border-border/50 shadow-xl bg-card/80 backdrop-blur-xl">
          <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <SignupForm />
          </Suspense>
        </Card>
      </motion.div>
    </div>
  );
}
