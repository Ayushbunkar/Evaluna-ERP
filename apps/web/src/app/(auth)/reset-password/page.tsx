"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Label } from "@evaluna/ui/components/label";
import { Input } from "@evaluna/ui/components/input";
import { Button } from "@evaluna/ui/components/button";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { useState, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, error: err } = await authClient.resetPassword({
        newPassword: password,
        token: token,
      });

      if (err) {
        setError(err.message || "Invalid or expired token.");
      } else {
        setIsSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <CardContent className="space-y-4">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-emerald-700 dark:text-emerald-300 font-medium">Password Reset Successful</p>
          <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            Redirecting to login...
          </p>
        </div>
      </CardContent>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        {!token && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center mb-4">
            No reset token found in URL.
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!token}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={!token}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full" disabled={isLoading || !token}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Reset Password
        </Button>
      </CardFooter>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below to regain access.
          </CardDescription>
        </CardHeader>
        <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </Card>
    </div>
  );
}
