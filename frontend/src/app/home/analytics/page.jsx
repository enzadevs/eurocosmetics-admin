"use client";

import Link from "next/link";
import BackForthButtons from "@/components/nav/BackForthButtons";
import TodaysSum from "@/components/analytics/TodaysSum";
import SalesAndRevenue from "@/components/analytics/SalesAndRevenue";
import MostSoldProducts from "@/components/analytics/MostSoldProducts";
import PopularCategories from "@/components/analytics/PopularCategories";
import PopularSubCategories from "@/components/analytics/PopularSubCategories";
import VisitorsChart from "@/components/analytics/VisitorsChart";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { CalendarSearch } from "lucide-react";

export default function AnalyticsPage() {
  const { admin } = useAdminStore();

  return (
    <>
      {admin?.user?.Role === "ADMIN" ? (
        <div className="flex flex-col">
          <div className="center-row h-12">
            <BackForthButtons />
            <h2>Аналитика</h2>
            <Link
              href="/home/analytics/select"
              className="btn-primary center-row gap-2 ml-auto px-4"
            >
              <CalendarSearch className="size-5" />
              <span className="hidden md:block">Выбрать дату</span>
            </Link>
          </div>
          <div className="flex flex-col gap-2 mb-4">
            <TodaysSum />
            <SalesAndRevenue />
            <MostSoldProducts />
            <PopularCategories />
            <PopularSubCategories />
            <VisitorsChart />
          </div>
        </div>
      ) : (
        <div className="center-col min-h-[70vh]">
          <h2>У Вас нету прав для просмотра этой страницы</h2>
        </div>
      )}
    </>
  );
}
