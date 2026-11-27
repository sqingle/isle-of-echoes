"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PAINTED, SceneBackdrop } from "@/components/SceneBackdrop";
import { useSession } from "@/components/SessionProvider";
import { LOCATION_BY_ID, type LocationId, type SubtestId } from "@/lib/game";
import { ItemTrial } from "./ItemTrial";
import { RapidTrial } from "./RapidTrial";

export function Realm({ id }: { id: LocationId }) {
  const router = useRouter();
  const { configured } = useSession();

  useEffect(() => {
    if (!configured) router.replace("/setup");
  }, [configured, router]);

  const loc = LOCATION_BY_ID[id];
  return (
    <main className="relative min-h-dvh overflow-x-clip">
      <SceneBackdrop scene={id} dim={id in PAINTED ? 0.04 : 0.18} />
      {configured &&
        (id === "rapid" ? <RapidTrial location={loc} /> : <ItemTrial location={loc} subtest={id as SubtestId} />)}
    </main>
  );
}
