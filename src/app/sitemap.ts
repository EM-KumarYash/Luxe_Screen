import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { path: "/", priority: 1 },
    { path: "/gallery", priority: 0.9 },
    { path: "/booking", priority: 0.9 },
    { path: "/ai-planner", priority: 0.8 },
    { path: "/waitlist", priority: 0.5 },
  ].map(({ path, priority }) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: "weekly",
    priority,
  }));
}
