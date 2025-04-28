import Link from "next/link";
import BackForthButtons from "@/components/nav/BackForthButtons";
import CategoriesTable from "@/components/tables/Categories";
import { Plus } from "lucide-react";

export default function CategoriesPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Категории</h2>
        <Link
          href="/home/categories/new"
          className="btn-primary center-row gap-2 px-2 ml-auto"
        >
          <Plus className="size-5" />
          <span className="hidden md:block text-sm">Новая категория</span>
        </Link>
      </div>
      <CategoriesTable />
    </div>
  );
}
