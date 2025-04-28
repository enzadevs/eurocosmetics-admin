import BackForthButtons from "@/components/nav/BackForthButtons";
import WaitlistProductsTable from "@/components/tables/Waitlist";

export default function ProductsPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row gap-2 h-12">
        <BackForthButtons />
        <h2>Ожидаемые товары</h2>
      </div>
      <WaitlistProductsTable />
    </div>
  );
}
