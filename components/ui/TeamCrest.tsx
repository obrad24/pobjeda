import Image from "next/image";
import { teamInitials } from "@/lib/format";

export function TeamCrest({
  name,
  logo,
  size = "md",
  preload = false,
}: {
  name: string;
  logo?: string | null;
  size?: "sm" | "md" | "lg";
  preload?: boolean;
}) {
  const px = size === "lg" ? 88 : size === "sm" ? 40 : 64;
  const text = size === "lg" ? "text-xl" : size === "sm" ? "text-xs" : "text-sm";

  if (logo) {
    return (
      <Image
        src={logo}
        alt={name}
        width={px}
        height={px}
        preload={preload}
        className="rounded-full border border-white/20 bg-navy-dark/50 object-contain p-0.5"
        unoptimized={logo.startsWith("http")}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 font-display font-semibold text-gold ${text}`}
      style={{ width: px, height: px }}
    >
      {teamInitials(name)}
    </span>
  );
}
