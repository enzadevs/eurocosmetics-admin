import BackForthButtons from "@/components/nav/BackForthButtons";
import CancelledOrdersTable from "@/components/tables/Cancelled";

export default function OrdersPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Отмененные заказы</h2>
      </div>
      <CancelledOrdersTable />
    </div>
  );
}
