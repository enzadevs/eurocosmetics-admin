import Link from "next/link";
import BackForthButtons from "@/components/nav/BackForthButtons";
import GiftCardsTable from "@/components/tables/GiftCards";
import { Plus } from "lucide-react";

export default function BannersPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Гифт карты</h2>
        <Link
          href="/home/giftcard/new"
          className="btn-primary center-row gap-2 px-2 ml-auto"
        >
          <Plus className="size-5" />
          <span className="hidden md:block text-sm">Новая гифт карта</span>
        </Link>
      </div>
      <GiftCardsTable />
    </div>
  );
}
