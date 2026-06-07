import { Bell, Search } from "lucide-react";

export function TopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
      <h1 className="font-display text-xl font-bold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary-hover md:flex">
          <Search className="h-4 w-4" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary-hover">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
