"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password))
    return "Must contain at least one uppercase letter";
  if (!/[a-z]/.test(password))
    return "Must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Must contain at least one number";
  return null;
}

interface PasswordFormProps {
  submitLabel: string;
  onSubmit: (password: string) => Promise<void>;
}

export function PasswordForm({ submitLabel, onSubmit }: PasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Label htmlFor="password">Password</Label>
      <Input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-1"
        autoFocus
      />
      <Label htmlFor="confirm" className="mt-4 block">
        Confirm password
      </Label>
      <Input
        id="confirm"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="mt-1"
      />
      <p className="text-xs text-gray-500 mt-2">
        8+ characters, uppercase, lowercase, and number required
      </p>
      <Button type="submit" disabled={loading} className="w-full mt-4">
        {loading ? "Loading..." : submitLabel}
      </Button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </form>
  );
}
