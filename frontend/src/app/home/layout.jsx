"use client";

import Link from "next/link";
import Image from "next/image";
import AuthGuard from "@/components/utils/AuthGuard";
import ThemeSwitcher from "@/components/nav/ThemeSwitcher";
import ThemeSwitcherButton from "@/components/nav/ThemeSwitcherButton";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  X,
  PanelLeftOpen,
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
  MessageSquareText,
  ChartSpline,
  Cog,
  UserRound,
  LogOut,
} from "lucide-react";

const DrawerButton = ({ url, children, classes }) => {
  return (
    <Link href={url} className={`drawer-button ${classes}`}>
      {children}
    </Link>
  );
};

const DrawerButtonSmall = ({ url, children }) => {
  return (
    <Link href={url} className="drawer-button-small">
      {children}
    </Link>
  );
};

const ROLE_PERMISSIONS = {
  ADMIN: [
    "/home/orders",
    "/home/deliveredorders",
    "/home/cancelledorders",
    "/home/products",
    "/home/categories",
    "/home/subcategories",
    "/home/segments",
    "/home/stories",
    "/home/brands",
    "/home/push",
    "/home/popup",
    "/home/banners",
    "/home/analytics",
    "/home/manage",
  ],
  MANAGER: [
    "/home/orders",
    "/home/deliveredorders",
    "/home/cancelledorders",
    "/home/products",
    "/home/categories",
    "/home/subcategories",
    "/home/segments",
    "/home/stories",
    "/home/brands",
    "/home/push",
    "/home/popup",
    "/home/banners",
    "/home/manage",
  ],
  CASHIER: [
    "/home/orders",
    "/home/deliveredorders",
    "/home/cancelledorders",
    "/home/products",
  ],
};

export default function HomeLayout({ children }) {
  const [drawerIsOpened, setDrawerIsOpened] = useState(null);
  const { admin, removeAdmin } = useAdminStore();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("drawerIsOpened");
      setDrawerIsOpened(savedState === "true");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && drawerIsOpened !== null) {
      localStorage.setItem("drawerIsOpened", drawerIsOpened);
    }
  }, [drawerIsOpened]);

  const getActiveIcon = (route, filledIcon, outlineIcon) =>
    pathname.startsWith(route) ? filledIcon : outlineIcon;

  function confirmLogOut() {
    if (window.confirm(`Вы уверены, что хотите выйти?`)) {
      removeAdmin();
    }
  }

  if (drawerIsOpened === null) {
    return null;
  }

  const role = admin?.user?.Role || "GUEST";
  const allowedRoutes = ROLE_PERMISSIONS[role] || [];

  const drawerButtons = [
    { url: "/home/orders", label: "Заказы", Icon: ClipboardList },
    {
      url: "/home/deliveredorders",
      label: "Доставленные заказы",
      Icon: ClipboardCheck,
    },
    {
      url: "/home/cancelledorders",
      label: "Отмененные заказы",
      Icon: ClipboardX,
    },
    { url: "/home/products", label: "Товары", Icon: Package },
    { url: "/home/categories", label: "Категории", Icon: Boxes },
    { url: "/home/subcategories", label: "Под категории", Icon: Grid2x2 },
    { url: "/home/segments", label: "Сегменты", Icon: Grid3x3 },
    { url: "/home/brands", label: "Бренды", Icon: ShieldCheck },
    { url: "/home/push", label: "Пуш уведомления", Icon: MessageSquareText },
    { url: "/home/popup", label: "Pop Up", Icon: BellPlus },
    { url: "/home/banners", label: "Баннеры", Icon: ImagePlus },
    { url: "/home/analytics", label: "Аналитика", Icon: ChartSpline },
    { url: "/home/manage", label: "Настройки", Icon: Cog },
  ].filter((button) => allowedRoutes.includes(button.url));

  return (
    <AuthGuard>
      <div
        className={`fixed top-0 left-0 h-full transition-all duration-300 ease-in-out z-10 ${
          drawerIsOpened ? "translate-x-0 w-72" : "-translate-x-0 w-11 md:w-14"
        } overflow-hidden`}
      >
        <div
          className={`hide-on-print ${
            drawerIsOpened ? "w-72" : "overflow-hidden w-11 md:w-14"
          }`}
        >
          {drawerIsOpened ? (
            <div className="flex flex-col gap-[2px] h-full w-full">
              <div className="center-row gap-2">
                <DrawerButton url="/home" classes="grow">
                  <div className="center-col h-9 w-9">
                    <Image
                      src="/logo.png"
                      width={32}
                      height={32}
                      alt="logo of eurocosmetics"
                      quality={70}
                      className="rounded-l"
                    />
                  </div>
                  <span>Euro Cosmetics</span>
                </DrawerButton>
                <button
                  onClick={() => setDrawerIsOpened(!drawerIsOpened)}
                  className="btn-small ml-auto"
                >
                  <X className="size-4" />
                </button>
              </div>
              {drawerButtons.map(({ url, label, Icon }) => (
                <DrawerButton url={url} key={url}>
                  {getActiveIcon(
                    url,
                    <>
                      <div className="center-col size-9">
                        <Icon className="text-primary size-5" />
                      </div>
                      <span className="font-medium text-sm text-primary">
                        {label}
                      </span>
                    </>,
                    <>
                      <div className="center-col size-9">
                        <Icon className="size-4" />
                      </div>
                      <span>{label}</span>
                    </>
                  )}
                </DrawerButton>
              ))}
              {/* <ThemeSwitcherButton /> */}
              <div className="center-row justify-between gap-2 mt-auto h-10 w-full">
                <div className="bg-white dark:bg-darkTwo basic-border center-row text-dark dark:text-support transition hover:text-primary px-2 h-9 md:h-10 w-full">
                  <div className="center-col size-9">
                    <UserRound className="text-dark dark:text-support size-5" />
                  </div>
                  <span className="text-dark dark:text-support">
                    {admin?.user?.username}
                  </span>
                </div>
                <button onClick={confirmLogOut} className="btn-small-2 mt-auto">
                  <div className="center-col size-9">
                    <LogOut className="size-4" />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 custom-scrollbar overflow-x-hidden">
              <button
                onClick={() => setDrawerIsOpened(!drawerIsOpened)}
                className="btn-small min-h-10"
              >
                <PanelLeftOpen className="size-4" />
              </button>
              {drawerButtons.map(({ url, Icon }) => (
                <DrawerButtonSmall url={url} key={url}>
                  {getActiveIcon(
                    url,
                    <Icon className="text-primary size-5" />,
                    <Icon className="size-4" />
                  )}
                </DrawerButtonSmall>
              ))}
              {/* <ThemeSwitcher /> */}
              <button
                onClick={() => {
                  confirmLogOut();
                }}
                className="btn-small-2 items-center justify-center mt-auto h-10 w-10"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        className={`bg-white dark:bg-dark flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-screen margin-onprint ${
          drawerIsOpened ? "ml-0 md:ml-72" : "ml-11 md:ml-14"
        }`}
      >
        <div className="pb-2 md:pb-0 px-1 md:px-2">{children}</div>
      </div>
    </AuthGuard>
  );
}
