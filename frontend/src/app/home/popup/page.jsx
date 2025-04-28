import Link from "next/link";
import BackForthButtons from "@/components/nav/BackForthButtons";
import PopUpsTable from "@/components/tables/PopUps";
import { Plus } from "lucide-react";

export default function PopUpPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>PopUp</h2>
        <Link
          href="/home/popup/new"
          className="btn-primary center-row gap-2 px-2 ml-auto"
        >
          <Plus className="size-5" />
          <span className="hidden md:block text-sm">Новый PopUp</span>
        </Link>
      </div>
      <PopUpsTable />
    </div>
  );
}
