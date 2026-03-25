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
    <div className="h-screen w-full relative bg-black">

      {/* 🗺️ MAPA */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          positions={tracker.positions}
          currentPosition={currentPosition}
        />
      </div>

      {/* 🎮 UI FIXA */}
      <div className="absolute bottom-6 left-0 right-0 px-4 z-20">
        <RunTracker {...tracker} />
      </div>
    </div>
  );
}