"use client";

import useSWR from "swr";
import { apiUrl } from "../utils/utils";
import dynamic from "next/dynamic";
const CurrentMonthSalesChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function SalesAndRevenue() {
  const { data, isLoading, isError } = useSWR(
    `${apiUrl}/analytics/revenue/currentmonth`,
    fetcher
  );

  if (isLoading) return <></>;
  if (isError) return <></>;

  const daysOfMonth = {
    chart: {
      id: "month-revenue",
    },
    xaxis: {
      categories: data.daysOfMonth,
    },
  };

  const salesSeries = [
    {
      name: "Сумма продаж",
      data: data.series?.[0]?.data || [],
      color: "#a855f7",
    },
    {
      name: "Прибыль",
      data: data.series?.[1]?.data || [],
      color: "#22c55e",
    },
  ];

  return (
    <div className="chart-box custom-scrollbar overflow-y-hidden z-0">
      <div className="center-row gap-2 pl-2 h-11">
        <p className="text-purple-500 font-semibold">Сумма продаж /</p>
        <p className="text-green-500 font-semibold">Прибыль</p>
        <p>(текущий месяц)</p>
      </div>
      <CurrentMonthSalesChart
        type="area"
        options={daysOfMonth}
        series={salesSeries}
        height={"400px"}
        width={"100%"}
        className="min-w-[768px]"
      />
    </div>
  );
}
