import { TimeTravelView } from "@/features/timetravel/TimeTravelView";
import { Header } from "@/components/Header";

export default function TimeTravel() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-full pb-20 md:pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">⏳ Time Travel</h1>
          <p className="text-muted-foreground mt-1">
            Explore your tasks across time and space
          </p>
        </div>
        <div className="h-[calc(100vh-200px)] rounded-lg border border-border overflow-hidden">
          <TimeTravelView />
        </div>
      </main>
    </div>
  );
}
