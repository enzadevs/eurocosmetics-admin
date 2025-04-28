import BackForthButtons from "@/components/nav/BackForthButtons";
import Link from "next/link";
import { FileDown, FileUp } from "lucide-react";

export default function SyncPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Импорт / Экспорт</h2>
      </div>
      <div className="center-row gap-4">
        <Link
          href="/home/sync/import"
          className="basic-border center-row justify-center gap-2 text-dark dark:text-support transition hover:text-primary px-4 h-20 w-full"
        >
          <FileDown className="size-5" />
          <span className="text-base">Импорт</span>
        </Link>
        <Link
          href="/home/sync/export"
          className="basic-border center-row justify-center gap-2 text-dark dark:text-support transition hover:text-primary px-4 h-20 w-full"
        >
          <FileUp className="size-5" />
          <span className="text-base">Экспорт</span>
        </Link>
      </div>
    </div>
  );
}
