import type { MetadataRoute } from "next";
import { getAllStates } from "@/lib/engine/state";
import { stateCodeToSlug } from "@/lib/utils/slug";

const BASE_URL = "https://uspaycheckhq.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const stateRoutes: MetadataRoute.Sitemap = getAllStates().map((state) => ({
    url: `${BASE_URL}/${stateCodeToSlug(state.code)}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...stateRoutes,
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
