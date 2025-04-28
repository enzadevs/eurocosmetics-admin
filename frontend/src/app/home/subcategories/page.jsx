import Link from "next/link";
import BackForthButtons from "@/components/nav/BackForthButtons";
import SubCategoriesTable from "@/components/tables/SubCategories";
import { Plus } from "lucide-react";

export default function CategoriesPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Под категории</h2>
        <Link
          href="/home/subcategories/new"
          className="btn-primary center-row gap-2 px-2 ml-auto"
        >
          <Plus className="size-5" />
          <span className="hidden md:block text-sm">Новая Подкатегория</span>
        </Link>
      </div>
      <SubCategoriesTable />
    </div>
  );
}
