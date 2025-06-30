"use client";

import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
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
        onClick={() => navigate('/')}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Go back home
      </button>
    </div>
  );
}
