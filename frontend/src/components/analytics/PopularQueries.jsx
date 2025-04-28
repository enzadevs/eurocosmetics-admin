"use client";

import { apiUrl } from "../utils/utils";
import Pagination from "../nav/Pagination";
import dynamic from "next/dynamic";
const PopularQueriesChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
import { useState, useEffect, useRef } from "react";

const fetchData = async (filters) => {
  const response = await fetch(`${apiUrl}/actions/query/fetch`, {
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

export default function PopularQueries() {
  const [data, setData] = useState({ queries: [], pagination: {} });
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
      id: "most-sold-queries",
    },
    xaxis: { categories: data.queries.map((item) => item.query) },
  };

  const chartSeries = [
    {
      name: "Кол. запросов",
      data: data.queries.map((item) => parseInt(item.count, 10)),
      color: "#a855f7",
    },
  ];

  return (
    <div className="chart-box z-0 p-2">
      <div className="center-row gap-2 h-12">
        <p className="text-purple-500 font-semibold">
          Самые частые слова поиска
        </p>
      </div>
      <PopularQueriesChart
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
