"use client";

export const dynamic = "force-dynamic";

import dynamicNext from "next/dynamic";
import { useTracker } from "@/hooks/useTracker";
import RunTracker from "@/components/RunTracker";
import { useMemo } from "react";

const MapContainer = dynamicNext(
  () => import("@/components/Map").then((mod) => mod.default),
  { ssr: false }
);

export default function RunPage() {
  const tracker = useTracker();

  const currentPosition = useMemo(() => {
    return tracker.positions.length
      ? tracker.positions[tracker.positions.length - 1]
      : null;
  }, [tracker.positions]);

  return (
    <div className="h-screen w-full relative">
      <MapContainer
        positions={tracker.positions}
        currentPosition={currentPosition}
      />

      <div className="absolute bottom-10 left-0 right-0 px-4">
        <RunTracker {...tracker} />
      </div>
    </div>
  );
}