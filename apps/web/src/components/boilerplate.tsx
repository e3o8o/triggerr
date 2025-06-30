import { siteConfig } from "@/config/site.config";

export function Layout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}

export function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="relative space-y-12 pt-12 pb-8 text-center">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {siteConfig.title}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {siteConfig.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Docs() {
  return (
    <div className="w-full">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Comprehensive guides and API documentation for getting started.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <p className="text-muted-foreground">
            Documentation content will go here. This is a placeholder for the actual documentation content.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Examples() {
  return (
    <div className="w-full">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Examples</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Explore practical examples to help you get started quickly.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Example {i}</h3>
              <p className="text-muted-foreground">
                This is an example card. Replace this with your actual example content.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
