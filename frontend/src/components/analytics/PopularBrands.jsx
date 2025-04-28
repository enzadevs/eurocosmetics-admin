"use client";

import { apiUrl } from "../utils/utils";
import Pagination from "../nav/Pagination";
import dynamic from "next/dynamic";
const MostSoldbrandsChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
import { useState, useEffect, useRef } from "react";

const fetchData = async (filters) => {
  const response = await fetch(`${apiUrl}/analytics/popularbrands`, {
    method: "POST",
    body: JSON.stringify({
      page: filters.page,
      limit: 10,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
};

export default function PopularBrands() {
  const [data, setData] = useState({ brands: [], pagination: {} });
  const currentPageRef = useRef(1);

  useEffect(() => {
    const getData = async () => {
      const response = await fetchData({
        page: currentPageRef.current,
      });
      setData(response);
    };

    getData();
  }, []);

  const handleRequest = async () => {
    const filters = { page: currentPageRef.current };
    const response = await fetchData(filters);
    setData(response);
  };

  const handlePageChange = (newPage) => {
    currentPageRef.current = newPage;
    handleRequest();
  };

  const chartOptions = {
    chart: {
      id: "most-sold-brands",
    },
    xaxis: { categories: data.brands.map((item) => item.brandName) },
  };

  const chartSeries = [
    {
      name: "Продано",
      data: data.brands.map((item) => parseInt(item.quantitySold, 10)),
      color: "#f59e0b",
    },
  ];

  return (
    <div className="chart-box z-0 p-2">
      <div className="center-row gap-2 h-12">
        <p className="text-amber-500 font-semibold">Самые продаваемые бренды</p>
      </div>
      <MostSoldbrandsChart
        type="bar"
        options={chartOptions}
        series={chartSeries}
        height={"400px"}
        width={"100%"}
      />
      <Pagination
        currentPageRef={currentPageRef}
        onPageChange={handlePageChange}
        totalPages={data?.pagination?.totalPages}
      />
    </div>
  );
}
