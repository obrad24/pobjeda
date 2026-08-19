import Image from "next/image";
import { SITE_NAME } from "@/lib/nav";

const LOGO = {
  src: "/logo.png",
  width: 181,
  height: 150,
} as const;

const sizes = {
  sm: "h-10 w-auto",
  md: "h-12 w-auto",
  lg: "h-24 w-auto sm:h-28",
} as const;

export function ClubLogo({
  size = "sm",
  className = "",
  decorative = false,
  preload,
}: {
  size?: keyof typeof sizes;
  className?: string;
  decorative?: boolean;
  preload?: boolean;
}) {
  return (
    <Image
      src={LOGO.src}
      alt={decorative ? "" : SITE_NAME}
      width={LOGO.width}
      height={LOGO.height}
      preload={preload}
      unoptimized
      className={`${sizes[size]} ${className}`.trim()}
    />
  );
}
