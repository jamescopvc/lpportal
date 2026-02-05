"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <p className="text-red-600 text-sm">
        {error.message || "Something went wrong."}
      </p>
      <button onClick={reset} className="text-sm underline mt-2">
        Try again
      </button>
    </div>
  );
}
