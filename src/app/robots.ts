import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils/app-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/business", "/admin", "/api", "/auth"] },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
