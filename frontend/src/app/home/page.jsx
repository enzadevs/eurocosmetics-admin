"use client";

import IndexButton from "@/components/containers/IndexButton";
import { useAdminStore } from "@/components/utils/useAdminStore";
import {
  ClipboardList,
  ClipboardCheck,
  ClipboardX,
  Package,
  Boxes,
  Grid2x2,
  Grid3x3,
  ShieldCheck,
  BellPlus,
  ImagePlus,
  Star,
  ThumbsUp,
  ChartSpline,
  Cog,
  MessageSquareText,
  Info,
  SquareTerminal,
  UserCog,
} from "lucide-react";
import { cloneElement } from "react";

export default function HomePage() {
  const { admin } = useAdminStore();
  const role = admin?.user?.Role;

  const buttons = [
    {
      url: "/home/orders",
      icon: <ClipboardList />,
      title: "Заказы",
      roles: ["ADMIN", "MANAGER", "CASHIER"],
    },
    {
      url: "/home/deliveredorders",
      icon: <ClipboardCheck />,
      title: "Доставленные заказы",
      roles: ["ADMIN", "MANAGER", "CASHIER"],
    },
    {
      url: "/home/cancelledorders",
      icon: <ClipboardX />,
      title: "Отменненые заказы",
      roles: ["ADMIN", "MANAGER", "CASHIER"],
    },
    {
      url: "/home/products",
      icon: <Package />,
      title: "Товары",
      roles: ["ADMIN", "MANAGER", "CASHIER"],
    },
    {
      url: "/home/categories",
      icon: <Boxes />,
      title: "Категории",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      url: "/home/subcategories",
      icon: <Grid2x2 />,
      title: "Под категории",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      url: "/home/segments",
      icon: <Grid3x3 />,
      title: "Сегменты",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      url: "/home/brands",
      icon: <ShieldCheck />,
      title: "Бренды",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      url: "/home/popup",
      icon: <BellPlus />,
      title: "Pop up",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      url: "/home/banners",
      icon: <ImagePlus />,
      title: "Баннеры",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      url: "/home/manage/customers",
      icon: <UserCog />,
      title: "Клиенты",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      url: "/home/marketreviews",
      icon: <ThumbsUp />,
      title: "Отзывы магазина",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      url: "/home/productreviews",
      icon: <Star />,
      title: "Отзывы товаров",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      url: "/home/push",
      icon: <MessageSquareText />,
      title: "Пуш уведомления",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      url: "/home/analytics",
      icon: <ChartSpline />,
      title: "Аналитика",
      roles: ["ADMIN"],
    },
    {
      url: "/home/settings",
      icon: <Info />,
      title: "О нас",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      url: "/home/manage",
      icon: <Cog />,
      title: "Настройки",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      url: "/home/logs",
      icon: <SquareTerminal />,
      title: "Действия",
      roles: ["ADMIN"],
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <h2>Добро пожаловать</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {buttons
          .filter((button) => button.roles.includes(role))
          .map(({ url, icon, title }) => (
            <IndexButton
              key={url}
              url={url}
              icon={cloneElement(icon, {
                className: "text-dark dark:text-support size-6 md:size-10",
              })}
              title={title}
            />
          ))}
      </div>
    </div>
  );
}
