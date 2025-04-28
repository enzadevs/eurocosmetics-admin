import BackForthButtons from "@/components/nav/BackForthButtons";
import IndexButton from "@/components/containers/IndexButton";
import {
  Map,
  Truck,
  Clock,
  HandCoins,
  List,
  Percent,
  UsersRound,
  UserRoundCog,
} from "lucide-react";

export default function ManagemenPage() {
  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Настройки товаров и заказов</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <IndexButton
          url="/home/manage/regions"
          icon={<Map className="size-6 md:size-10" />}
          title="Регионы"
        />
        <IndexButton
          url="/home/manage/deliverytypes"
          icon={<Truck className="size-6 md:size-10" />}
          title="Способ доставки"
        />
        <IndexButton
          url="/home/manage/ordertimes"
          icon={<Clock className="size-6 md:size-10" />}
          title="Время доставки"
        />
        <IndexButton
          url="/home/manage/paymenttypes"
          icon={<HandCoins className="size-6 md:size-10" />}
          title="Способ оплаты"
        />
        <IndexButton
          url="/home/manage/orderstatuses"
          icon={<List className="size-6 md:size-10" />}
          title="Статус заказов"
        />
        <IndexButton
          url="/home/manage/productstatuses"
          icon={<Percent className="size-6 md:size-10" />}
          title="Статус товаров"
        />
        <IndexButton
          url="/home/manage/customers"
          icon={<UsersRound className="size-6 md:size-10" />}
          title="Клиенты"
        />
        <IndexButton
          url="/home/manage/users"
          icon={<UserRoundCog className="size-6 md:size-10" />}
          title="Пользователи"
        />
      </div>
    </div>
  );
}
