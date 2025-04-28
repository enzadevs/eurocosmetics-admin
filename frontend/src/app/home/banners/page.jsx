import Link from "next/link";
import BackForthButtons from "@/components/nav/BackForthButtons";
import BannersTable from "@/components/tables/Banners";
import { Plus } from "lucide-react";

export default function BannersPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Баннеры</h2>
        <Link
          href="/home/banners/new"
          className="btn-primary center-row gap-2 px-2 ml-auto"
        >
          <Plus className="size-5" />
          <span className="hidden md:block text-sm">Новый баннер</span>
        </Link>
      </div>
      <BannersTable />
    </div>
  );
}
