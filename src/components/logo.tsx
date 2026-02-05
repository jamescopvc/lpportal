// Place your logo at /public/logo.png
// brightness-0 forces it to render as black regardless of source color —
// works best with a logo that has a transparent background.
import Image from "next/image";

export function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="ScOp"
      width={120}
      height={40}
      priority
      className="h-10 w-auto brightness-0"
    />
  );
}
