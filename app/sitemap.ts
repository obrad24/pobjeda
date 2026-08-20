import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { getPlayers } from "@/lib/players";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const players = await getPlayers();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/igraci",
    "/formacija",
    "/statistika",
    "/fantasy",
    "/liga",
    "/rezultati",
    "/istorija",
    "/shop",
  ].map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/liga" || path === "/rezultati" ? "hourly" : "daily",
    priority: path === "" ? 1 : 0.8,
  }));

  const playerRoutes: MetadataRoute.Sitemap = players.map((player) => ({
    url: `${base}/igraci/${player.slug}`,
    lastModified: player.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...playerRoutes];
}
