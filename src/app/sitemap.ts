import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils/app-url";

// Public profiles are added once the repository can enumerate them (Phase 3, with verification pages).
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: appUrl(), changeFrequency: "weekly", priority: 1 }];
}
