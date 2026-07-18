import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { ClubsManager } from "@/components/admin/clubs/clubs-manager";
import { toClubDTO } from "@/lib/clubs/mappers";

export const dynamic = "force-dynamic";

export default async function ClubsPage() {
  const clubs = await prisma.club.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader title="Clubs" subtitle="gPoint locations shown on the public site" />
      <ClubsManager clubs={clubs.map(toClubDTO)} />
    </>
  );
}
