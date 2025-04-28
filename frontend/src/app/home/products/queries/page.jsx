import BackForthButtons from "@/components/nav/BackForthButtons";
import PopularQueries from "@/components/analytics/PopularQueries";

export default function PopularQueriesPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Частые поисковые запросы</h2>
      </div>
      <PopularQueries />
    </div>
  );
}
