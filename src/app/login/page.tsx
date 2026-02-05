"use client";

import { useState } from "react";
import {
  checkEmail,
  sendMagicLink,
  signInWithPassword,
  resetPassword,
} from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginState =
  | "email"
  | "password"
  | "magic_link_sent"
  | "not_allowed"
  | "reset_sent";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginState>("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailContinue = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);

    try {
      const result = await checkEmail(email);
      switch (result.status) {
        case "not_allowed":
          setState("not_allowed");
          break;
        case "new_user":
          const magicResult = await sendMagicLink(email);
          if (magicResult && !magicResult.success) {
            setError(magicResult.error || "An error occurred");
          } else {
            setState("magic_link_sent");
          }
          break;
        case "existing_user":
          setState("password");
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPassword(email, password);
      if (result && !result.success) {
        setError(result.error || "Invalid credentials");
        setLoading(false);
      }
      // If successful, redirect happens automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await resetPassword(email);
      if (result && !result.success) {
        setError(result.error || "An error occurred");
      } else {
        setState("reset_sent");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setState("email");
    setError(null);
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6">
        <h1 className="text-4xl font-light tracking-tight mb-12">
          ScOp Venture Capital
          <br />
          LP Portal
        </h1>

        {state === "email" && (
          <div>
            <Label htmlFor="email" className="text-xs font-medium text-gray-500">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailContinue()}
              className="mt-2"
              autoFocus
            />
            <Button
              onClick={handleEmailContinue}
              disabled={loading || !email}
              className="w-full mt-6"
            >
              {loading ? "Loading..." : "Continue"}
            </Button>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>
        )}

        {state === "not_allowed" && (
          <div>
            <p className="text-sm text-gray-600">Contact ScOp for access.</p>
            <button onClick={handleBack} className="text-sm text-gray-400 hover:text-black transition-colors mt-6">
              ← Back
            </button>
          </div>
        )}

        {(state === "magic_link_sent" || state === "reset_sent") && (
          <div>
            <p className="text-sm text-gray-600">
              {state === "magic_link_sent"
                ? "Check your email for a login link."
                : "Check your email for a password reset link."}
            </p>
            <button onClick={handleBack} className="text-sm text-gray-400 hover:text-black transition-colors mt-6">
              ← Back
            </button>
          </div>
        )}

        {state === "password" && (
          <div>
            <p className="text-sm text-gray-400 mb-6">{email}</p>
            <Label htmlFor="password" className="text-xs font-medium text-gray-500">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              className="mt-2"
              autoFocus
            />
            <Button
              onClick={handleSignIn}
              disabled={loading || !password}
              className="w-full mt-6"
            >
              {loading ? "Loading..." : "Sign in"}
            </Button>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleForgotPassword}
                className="text-sm text-gray-400 hover:text-black transition-colors"
              >
                Forgot password
              </button>
              <button onClick={handleBack} className="text-sm text-gray-400 hover:text-black transition-colors">
                ← Back
              </button>
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
