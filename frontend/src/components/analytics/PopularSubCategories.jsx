"use client";

import dynamic from "next/dynamic";
const PopularSubCategoriesChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
import { apiUrl } from "../utils/utils";
import { useState, useEffect } from "react";

const fetchData = async () => {
  const response = await fetch(`${apiUrl}/analytics/popularsubcategories`);
  const data = await response.json();
  return data;
};

export default function PopularSubCategories() {
  const [data, setData] = useState({ subcategories: [] });

  useEffect(() => {
    const getData = async () => {
      const response = await fetchData();
      setData(response);
    };

    getData();
  }, []);

  const chartOptions = {
    chart: {
      id: "popular-subcategories",
    },
    xaxis: {
      categories: data.subcategories.map(
        (subcategory) => subcategory.subcategoryName
      ),
    },
  };

  const chartSeries = [
    {
      name: "Продано",
      data: data.subcategories.map((subcategory) => subcategory.quantitySold),
      color: "#0ea5e9",
    },
  ];

  return (
    <div className="chart-box custom-scrollbar overflow-y-hidden z-0 p-2">
      <div className="center-row gap-2 h-10">
        <p className="text-sky-500 font-semibold">Популярные под категории</p>
      </div>
      <PopularSubCategoriesChart
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
