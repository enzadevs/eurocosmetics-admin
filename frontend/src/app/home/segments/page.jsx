import Link from "next/link";
import BackForthButtons from "@/components/nav/BackForthButtons";
import SegmentsTable from "@/components/tables/Segments";
import { Plus } from "lucide-react";

export default function SegmentsPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Сегменты</h2>
        <Link
          href="/home/segments/new"
          className="btn-primary center-row gap-2 px-2 ml-auto"
        >
          <Plus className="size-5" />
          <span className="hidden md:block text-sm">Новый сегмент</span>
        </Link>
      </div>
      <SegmentsTable />
    </div>
  );
}
