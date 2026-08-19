import Image from "next/image";
import { teamInitials } from "@/lib/format";
import { crestSrcForTeam } from "@/lib/sportdc/teams";

export function TeamCrest({
  name,
  logo,
  size = "md",
  preload = false,
}: {
  name: string;
  logo?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  preload?: boolean;
}) {
  const px = size === "lg" ? 88 : size === "md" ? 64 : size === "sm" ? 40 : 22;
  const text = size === "lg" ? "text-xl" : size === "sm" ? "text-xs" : size === "xs" ? "text-[8px]" : "text-sm";
  const src = crestSrcForTeam(name, logo);

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        preload={preload}
        className="object-contain p-0.5"
        unoptimized={src.startsWith("http") || src.endsWith(".svg")}
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
