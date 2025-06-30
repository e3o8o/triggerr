"use client";

import { useRouter } from "next/navigation";

/**
 * Next.js Not Found Page for Hybrid Navigation Model
 *
 * This not-found.tsx file handles cases where Next.js needs to render a 404 page
 * during the build process or when direct navigation occurs to non-existent routes.
 * It provides a standalone 404 component that matches the visual style of our
 * React Router NotFound component but doesn't require loading the entire client app.
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex min-h-full w-full flex-col items-center justify-center space-y-6 overflow-x-hidden px-4 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tight text-foreground sm:text-7xl">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-muted-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <button
          onClick={() => router.push("/shell")}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go back home
        </button>
      </div>
    </div>
  );
}
