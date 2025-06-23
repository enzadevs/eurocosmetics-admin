"use client";

import Pagination from "@/components/nav/Pagination";
import * as NProgress from "nprogress";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/components/utils/utils";
import { useState, useEffect, useRef } from "react";
import { Search, ArrowUp, ArrowDown } from "lucide-react";

const fetchBanners = async (filters) => {
  const response = await fetch(`${apiUrl}/minitwo/all`, {
    method: "POST",
    body: JSON.stringify({
      page: filters.page || 1,
      limit: 100,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
};

export default function ClientDays() {
  const [data, setData] = useState([]);
  const [sortedRows, setSortedRows] = useState([]);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const currentPageRef = useRef(1);
  const router = useRouter();

  useEffect(() => {
    const getBanners = async () => {
      const response = await fetchBanners({
        page: currentPageRef.current,
      });
      setData(response);
      setSortedRows(response?.banners);
    };

    getBanners();
  }, []);

  const filter = (event) => {
    const value = event.target.value.toLowerCase();
    setSortedRows(
      data?.banners?.filter((row) => {
        const joinedValues = Object.values(row).join(" ").toLowerCase();
        return joinedValues.includes(value);
      })
    );
  };

  const handleRequest = async () => {
    const filters = { page: currentPageRef.current };

    const response = await fetchBanners(filters);
    setData(response);
    setSortedRows(response?.ads);
  };

  const handlePageChange = (newPage) => {
    currentPageRef.current = newPage;
    handleRequest();
  };

  const toggleSortByField = (field) => {
    const newSortOrder =
      field === sortBy && sortOrder === "asc" ? "desc" : "asc";

    setSortBy(field);
    setSortOrder(newSortOrder);

    const sorted = [...sortedRows].sort((a, b) => {
      const valueA = isNaN(a[field]) ? a[field] : Number(a[field]);
      const valueB = isNaN(b[field]) ? b[field] : Number(b[field]);

      if (valueA == null) return 1;
      if (valueB == null) return -1;

      if (newSortOrder === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setSortedRows(sorted);
  };

  const sortIcon = (field) =>
    sortBy === field ? (
      sortOrder === "asc" ? (
        <ArrowUp className="text-dark h-4 w-4" />
      ) : (
        <ArrowDown className="text-dark h-4 w-4" />
      )
    ) : (
      <ArrowDown className="text-dark h-4 w-4" />
    );

  const renderArrows = (field) => (
    <span className="inline-flex float-right">{sortIcon(field)}</span>
  );

  return (
    <div className="flex flex-col min-h-[85vh]">
      <div className="bg-support dark:bg-darkTwo basic-border border-shadow shadow-support-200 rounded p-1 md:p-2 pb-4">
        <div className="relative center-row w-full">
          <input
            className="input-primary dark:text-support pl-2 pr-10"
            type="text"
            placeholder="Поиск..."
            onChange={filter}
          />
          <button className="border-l border-support-200 rounded-r center-col absolute right-0 size-9 md:size-10">
            <Search className="text-dark dark:text-support hover:text-primary size-5" />
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar mb-8">
          <table className="table-fixed min-w-[300px] w-full">
            <thead>
              <tr className="border-b border-support-200">
                <th className="w-16 text-xs md:text-sm">Картина</th>
                <th
                  className="text-xs md:text-sm w-20"
                  onClick={() => toggleSortByField("order")}
                >
                  Номер
                  {renderArrows("order")}
                </th>
                <th className="text-xs md:text-sm">Оглавление (ру)</th>
                <th className="text-xs md:text-sm">Оглавление (ткм)</th>
                <th className="text-xs md:text-sm">Активен</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows?.map((row, index) => (
                <tr
                  key={index}
                  onClick={() => {
                    NProgress.start();
                    router.push(`/home/minitwo/${row.id}`);
                  }}
                  className="border-b border-support-200 dark:border-grey-700 cursor-pointer transition hover:bg-white dark:hover:bg-dark"
                >
                  <td className="bg-white dark:bg-dark rounded center-col p-1 h-12 w-16">
                    <img
                      src={`${apiUrl}/${row.image}`}
                      width={112}
                      height={112}
                      alt="image of banner"
                      className="object-contain h-full w-auto"
                      crossOrigin="anonymous"
                    />
                  </td>
                  <td className="text-xs md:text-sm">{row.order}</td>
                  <td className="text-xs md:text-sm">{row.headerTm}</td>
                  <td className="text-xs md:text-sm">{row.headerRu}</td>
                  <td className="text-xs md:text-sm">
                    {row.isActive ? "Да" : "Нет"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sortedRows?.length && (
            <div className="bg-blue-200 dark:bg-black rounded center-col my-2 p-2 h-20">
              <p>Ничего не нашлось.</p>
            </div>
          )}
        </div>
      </div>
      {/* <Pagination
        currentPageRef={currentPageRef}
        onPageChange={handlePageChange}
        totalPages={data?.pagination?.totalPages}
      /> */}
    </div>
  );
}
