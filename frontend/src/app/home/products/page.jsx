import Link from "next/link";
import BackForthButtons from "@/components/nav/BackForthButtons";
import ProductsTable from "@/components/tables/Products";
import {
  PackagePlus,
  FileDown,
  FileUp,
  TextSearch,
  Hourglass,
} from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row gap-2 h-12">
        <BackForthButtons />
        <h2>Товары</h2>
        <Link
          href="/home/products/queries"
          className="btn-primary center-row gap-2 px-2 ml-auto"
        >
          <TextSearch className="size-5" />
          <span className="hidden md:block text-sm">Частые запросы</span>
        </Link>
        <Link
          href="/home/products/waitlist"
          className="btn-primary center-row gap-2 px-2"
        >
          <Hourglass className="size-5" />
          <span className="hidden md:block text-sm">Ожидаемые товары</span>
        </Link>
        <Link
          href="/home/sync/import"
          className="btn-primary center-row gap-2 px-2"
        >
          <FileDown className="size-5" />
          <span className="hidden md:block text-sm">Импорт</span>
        </Link>
        <Link
          href="/home/sync/export"
          className="btn-primary center-row gap-2 px-2"
        >
          <FileUp className="size-5" />
          <span className="hidden md:block text-sm">Экспорт</span>
        </Link>
        <Link
          href="/home/products/new"
          className="btn-primary center-row gap-2 px-2"
        >
          <PackagePlus className="size-5" />
          <span className="hidden md:block text-sm">Новый товар</span>
        </Link>
      </div>
      <ProductsTable />
    </div>
  );
}
