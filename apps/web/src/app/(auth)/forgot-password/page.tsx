"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Label } from "@evaluna/ui/components/label";
import { Input } from "@evaluna/ui/components/input";
import { Button } from "@evaluna/ui/components/button";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error: err } = await authClient.forgetPassword({
        email,
        redirectTo: "/reset-password",
      });

      if (err) {
        setError(err.message || "Something went wrong.");
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        
        {isSuccess ? (
          <CardContent className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">Check your email</p>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                We've sent a password reset link to <br/><span className="font-semibold text-emerald-700 dark:text-emerald-300">{email}</span>
              </p>
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/login">Return to Login</Link>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading || !email}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Link href="/login" className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
