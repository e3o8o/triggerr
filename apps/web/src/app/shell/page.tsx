"use client";

import nextDynamic from "next/dynamic";

const ClientAppRoot = nextDynamic(() => import("@/frontend/ClientAppRoot"), {
  ssr: false,
});

// Prevent static generation for this route since it handles all dynamic routes
export const dynamic = "force-dynamic";

export default function Shell() {
  return <ClientAppRoot />;
}
