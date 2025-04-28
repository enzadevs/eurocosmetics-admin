"use client";

import dynamic from "next/dynamic";
const PopularCategoriesChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
import { apiUrl } from "../utils/utils";
import { useState, useEffect } from "react";

const fetchPopularCategories = async () => {
  const response = await fetch(`${apiUrl}/analytics/popularcategories`);
  const data = await response.json();
  return data;
};

export default function PopularCategories() {
  const [data, setData] = useState({ categories: [] });

  useEffect(() => {
    const getData = async () => {
      const response = await fetchPopularCategories();
      setData(response);
    };

    getData();
  }, []);

  const chartOptions = {
    chart: {
      id: "popular-categories",
    },
    xaxis: {
      categories: data.categories.map((category) => category.categoryName),
    },
  };

  const chartSeries = [
    {
      name: "Продано",
      data: data.categories.map((category) => category.quantitySold),
      color: "#10b981",
    },
  ];

  return (
    <div className="chart-box custom-scrollbar overflow-y-hidden z-0 p-2">
      <div className="center-row gap-2 h-10">
        <p className="text-emerald-500 font-semibold">Популярные категории</p>
      </div>
      <PopularCategoriesChart
        type="bar"
        options={chartOptions}
        series={chartSeries}
        height={"400px"}
        width={"100%"}
        className="min-w-[1000px]"
      />
    </div>
  );
}
