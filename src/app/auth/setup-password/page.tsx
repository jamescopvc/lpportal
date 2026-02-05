"use client";

import { useRouter } from "next/navigation";
import { setupPassword, createUserRecord } from "@/lib/actions/auth";
import { PasswordForm } from "@/components/password-form";

export default function SetupPasswordPage() {
  const router = useRouter();

  const handleSubmit = async (password: string) => {
    await setupPassword(password);
    await createUserRecord();
    router.push("/portal");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6">
        <h1 className="text-2xl font-semibold mb-2">Set up your password</h1>
        <p className="text-sm text-gray-500 mb-6">
          Choose a password to access the portal.
        </p>
        <PasswordForm submitLabel="Set password" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
