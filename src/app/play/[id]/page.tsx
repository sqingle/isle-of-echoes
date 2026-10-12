import { notFound } from "next/navigation";
import { Realm } from "@/components/play/Realm";
import { LOCATIONS, isLocationId } from "@/lib/game";

export function generateStaticParams() {
  return LOCATIONS.map((l) => ({ id: l.id }));
}

export default async function PlayPage({ params }: PageProps<"/play/[id]">) {
  const { id } = await params;
  if (!isLocationId(id)) notFound();
  return <Realm id={id} />;
}
