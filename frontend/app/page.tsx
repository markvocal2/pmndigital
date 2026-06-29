import AgencySite from "@/components/agency/AgencySite";

// Marketing homepage is deploy-updated content — render dynamically so neither the
// browser nor Cloudflare serves a stale build (avoids the long s-maxage static cache).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "PMN Digital — รับออกแบบระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์เฉพาะทาง",
  description:
    "PMN Digital เอเจนซีออกแบบและพัฒนาระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์สั่งทำแบบครบวงจร ทำงานออนไลน์ บริหารโดยทีมยุคใหม่ที่เข้าใจทั้งเทคโนโลยีและธุรกิจ",
};

export default function Home() {
  return <AgencySite />;
}
