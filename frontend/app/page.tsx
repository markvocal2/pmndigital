import type { Metadata } from "next";
import AgencySite from "@/components/agency/AgencySite";
import { getPublicArticles, getPublicHome, getPublicSettings } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, home] = await Promise.all([getPublicSettings(), getPublicHome()]);
  const name = settings?.siteName || "PMN Digital";
  const seo = (home?.seo ?? {}) as { metaTitle?: string; metaDesc?: string; ogImage?: string };
  const title = seo.metaTitle || settings?.defaultMetaTitle || `${name} — รับออกแบบระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์เฉพาะทาง`;
  const description =
    seo.metaDesc ||
    settings?.defaultMetaDesc ||
    "PMN Digital เอเจนซีออกแบบและพัฒนาระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์สั่งทำแบบครบวงจร";
  const ogImage = seo.ogImage || settings?.ogDefaultUrl || undefined;
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, type: "website", siteName: name, images: ogImage ? [ogImage] : undefined },
    twitter: { card: "summary_large_image", title, description, images: ogImage ? [ogImage] : undefined },
  };
}

export default async function Home() {
  const [home, settings, articles] = await Promise.all([
    getPublicHome(),
    getPublicSettings(),
    getPublicArticles("limit=8&sort=latest"),
  ]);
  return <AgencySite content={home?.data} settings={settings} articles={articles.items} />;
}
