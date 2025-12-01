import { PageHeader } from "@/components/journal/PageHeader";
import { NewEntryButton } from "@/components/journal/NewEntryButton";
import { JournalEntryList } from "@/components/journal/JournalEntryList";
import { EmptyJournalState } from "@/components/journal/EmptyJournalState";

export default function Journal() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Journal" />
      
      <div className="px-4 pt-4">
        <NewEntryButton />
        <JournalEntryList />
        <EmptyJournalState />
      </div>
    </div>
  );
}
