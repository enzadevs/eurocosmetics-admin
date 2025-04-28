import BackForthButtons from "@/components/nav/BackForthButtons";
import DeliveredOrdersTable from "@/components/tables/Delivered";

export default function OrdersPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Доставленные заказы</h2>
      </div>
      <DeliveredOrdersTable />
    </div>
  );
}
