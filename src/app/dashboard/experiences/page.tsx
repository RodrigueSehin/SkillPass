import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceManager, type ItemView } from "@/components/resources/resource-manager";
import { requireUser } from "@/lib/auth/current-user";
import { formatPeriod } from "@/lib/utils/format";
import { getExperienceService } from "@/services/container";

export const metadata: Metadata = { title: "Expériences" };

export default async function ExperiencesPage() {
  const user = await requireUser();
  const experiences = await getExperienceService().list(user.id);
  const sorted = [...experiences].sort((a, b) => b.startDate.localeCompare(a.startDate));

  const items: ItemView[] = sorted.map((e) => ({
    id: e.id,
    title: e.title,
    subtitle: [e.company, e.location].filter(Boolean).join(" · "),
    lines: [formatPeriod(e.startDate, e.endDate), e.description ?? ""].filter(Boolean),
    badges: [],
    links: [],
    values: {
      title: e.title,
      company: e.company,
      location: e.location ?? "",
      description: e.description ?? "",
      startDate: e.startDate,
      endDate: e.endDate ?? "",
    },
  }));

  return (
    <>
      <PageHeader title="Expériences" description="Votre parcours professionnel." />
      <ResourceManager resource="experience" items={items} />
    </>
  );
}
