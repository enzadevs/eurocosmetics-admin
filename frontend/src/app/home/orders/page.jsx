import BackForthButtons from "@/components/nav/BackForthButtons";
import OrdersTable from "@/components/tables/Orders";

export default function OrdersPage() {
  return (
    <div className="flex flex-col mb-8">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Заказы</h2>
      </div>
      <OrdersTable />
    </div>
  );
}
