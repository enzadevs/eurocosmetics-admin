"use client";

import useSWR from "swr";
import { apiUrl } from "../utils/utils";
import dynamic from "next/dynamic";
const CurrentMonthVisitorsChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function VisitorsChart() {
  const { data, isLoading, isError } = useSWR(
    `${apiUrl}/visitor/currentmonth`,
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

  const trueValues = data?.series.map((item) => item.true);
  const falseValues = data?.series.map((item) => item.false);

  const visitorsCount = [
    {
      name: "Уникальные пользователи",
      data: trueValues,
      color: "#06b6d4",
    },
    {
      name: "Посетители",
      data: falseValues,
      color: "#40AB00",
    },
  ];

  return (
    <div className="chart-box custom-scrollbar overflow-y-hidden z-0">
      <div className="flex-row-center items-center gap-2 p-2 h-10">
        <p className="text-cyan-500 font-semibold">Уникальные посетители</p>
      </div>
      <CurrentMonthVisitorsChart
        type="bar"
        options={daysOfMonth}
        series={visitorsCount}
        height={"400px"}
        width={"100%"}
        className="min-w-[768px]"
      />
    </div>
  );
}
