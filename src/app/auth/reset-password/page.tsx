"use client";

import { useRouter } from "next/navigation";
import { setupPassword } from "@/lib/actions/auth";
import { PasswordForm } from "@/components/password-form";

export default function ResetPasswordPage() {
  const router = useRouter();

  const handleSubmit = async (password: string) => {
    await setupPassword(password);
    router.push("/portal");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6">
        <h1 className="text-2xl font-semibold mb-2">Reset your password</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter your new password below.
        </p>
        <PasswordForm submitLabel="Reset password" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
