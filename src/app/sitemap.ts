import { MetadataRoute } from "next";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

const BASE_URL = "https://www.joulkh.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/explore`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  if (!isFirebaseConfigured || !db) {
    return staticPages;
  }

  try {
    const snap = await getDocs(
      query(collection(db, "rooms"), where("status", "==", "published"))
    );
    const roomPages: MetadataRoute.Sitemap = snap.docs.map((d) => ({
      url: `${BASE_URL}/rooms/${d.id}`,
      lastModified: d.data().lastActivityAt
        ? new Date(d.data().lastActivityAt as number)
        : new Date(d.data().createdAt as number),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...staticPages, ...roomPages];
  } catch {
    return staticPages;
  }
}
