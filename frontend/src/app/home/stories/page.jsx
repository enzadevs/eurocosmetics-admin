import Link from "next/link";
import BackForthButtons from "@/components/nav/BackForthButtons";
import StoriesTable from "@/components/tables/StoriesTable";
import { Plus } from "lucide-react";

export default function StoriesPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-14">
        <BackForthButtons />
        <h2>Сторис</h2>
        <Link
          href="/home/stories/new"
          className="btn-primary center-row gap-2 px-2 ml-auto"
        >
          <Plus className="size-5" />
          <span className="hidden md:block text-sm">Новый Сторис</span>
        </Link>
      </div>
      <StoriesTable />
    </div>
  );
}
