import BackForthButtons from "@/components/nav/BackForthButtons";
import BrandsTable from "@/components/tables/Brands";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function BrandsPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Бренды</h2>
        <Link
          href="/home/brands/new"
          className="btn-primary center-row gap-2 px-2 ml-auto"
        >
          <Plus className="size-5" />
          <span className="hidden md:block text-sm">Новый бренд</span>
        </Link>
      </div>
      <BrandsTable />
    </div>
  );
}
