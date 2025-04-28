"use client";

import Pagination from "../nav/Pagination";
import * as NProgress from "nprogress";
import { apiUrl } from "../utils/utils";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

const fetchData = async (filters) => {
  const response = await fetch(`${apiUrl}/brands/fetch/admin`, {
    method: "POST",
    body: JSON.stringify({
      query: filters?.query,
      page: filters.page || 1,
      limit: 20,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
};

export default function BrandsTable() {
  const [data, setData] = useState([]);
  const [sortedRows, setSortedRows] = useState([]);
  const [query, setQuery] = useState("");
  const debounceTimeoutRef = useRef(null);
  const currentPageRef = useRef(1);
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchData({
        page: currentPageRef.current,
        query,
      });
      setData(response);
      setSortedRows(response?.brands);
    };

    getData();
  }, [query]);

  const filter = (event) => {
    const value = event.target.value.toLowerCase();

    clearTimeout(debounceTimeoutRef.current);

    debounceTimeoutRef.current = setTimeout(() => {
      setQuery(value);
    }, 2000);

    setSortedRows(
      data?.brands?.filter((row) => {
        const joinedValues = Object.values(row).join(" ").toLowerCase();
        return joinedValues.includes(value);
      })
    );
  };

  const handleRequest = async () => {
    const filters = {
      page: currentPageRef.current,
    };

    const response = await fetchData(filters);
    setData(response);
    setSortedRows(response?.brands);
  };

  const handlePageChange = (newPage) => {
    currentPageRef.current = newPage;
    handleRequest();
  };

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
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-fixed min-w-[300px] w-full">
            <thead>
              <tr className="border-b border-support-200">
                <th className="w-16">Лого</th>
                <th>Имя</th>
                <th>Создано</th>
                <th>Обновлено</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows?.map((row, index) => (
                <tr
                  key={index}
                  onClick={() => {
                    NProgress.start();
                    router.push(`/home/brands/${row.id}`);
                  }}
                  className="border-b border-support-200 cursor-pointer transition hover:bg-white dark:hover:bg-dark"
                >
                  <td className="bg-white dark:bg-dark rounded center-col p-1 h-12 w-16">
                    <img
                      src={`${apiUrl}/${row.image}`}
                      width={112}
                      height={112}
                      alt="image of brand"
                      className="object-contain h-full w-auto"
                      crossOrigin="anonymous"
                    />
                  </td>
                  <td>{row.name}</td>
                  <td>{row.createdAt}</td>
                  <td>{row.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sortedRows.length && (
            <div className="bg-blue-200 dark:bg-dark rounded center-col my-2 p-2 h-20">
              <p>Ничего не нашлось.</p>
            </div>
          )}
        </div>
      </div>
      <Pagination
        currentPageRef={currentPageRef}
        onPageChange={handlePageChange}
        totalPages={data?.pagination?.totalPages}
      />
    </div>
  );
}
