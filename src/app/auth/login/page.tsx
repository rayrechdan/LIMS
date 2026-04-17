"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter both email and password");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (!res) {
        setError("No response from server — try again");
      } else if (res.error) {
        setError("Invalid email or password");
      } else if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        setError("Something went wrong — try again");
      }
    } catch (err) {
      setError("Connection error — check the server is running");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-mist via-base to-teal-soft p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2h6v6l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-11V2z" />
              <path d="M9 2h6" />
              <path d="M8 14h8" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-ink">Klev LIMS</h1>
          <p className="text-sm text-gray mt-1">Laboratory Information Management</p>
        </div>

        <div className="bg-surface rounded-lg border border-border shadow-card-lg p-8">
          <h2 className="text-lg font-semibold text-ink mb-1">Sign in</h2>
          <p className="text-xs text-gray mb-6">Use your credentials to access the lab portal</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@lab.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            {error && (
              <div className="bg-critical-soft border border-critical/20 rounded-lg px-3 py-2.5 text-xs text-critical">
                {error}
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-[11px] text-gray text-center mb-2 uppercase tracking-wider font-medium">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-data text-gray">
              <div>admin@lab.com</div><div>admin123</div>
              <div>patient@lab.com</div><div>patient123</div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray mt-6">
          Are you a patient?{" "}
          <Link href="/auth/patient/login" className="text-teal font-semibold hover:underline">Patient sign-in</Link>
        </p>
        <p className="text-center text-[11px] text-gray mt-2">© 2026 Klev LIMS · All rights reserved</p>
      </div>
    </div>
  );
}
