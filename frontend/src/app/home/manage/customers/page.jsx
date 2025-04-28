"use client";

import * as NProgress from "nprogress";
import BackForthButtons from "@/components/nav/BackForthButtons";
import Pagination from "@/components/nav/Pagination";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Lock, Unlock } from "lucide-react";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";

const fetchData = async (filters) => {
  const response = await fetch(`${apiUrl}/customer/all`, {
    method: "POST",
    body: JSON.stringify({
      page: filters.page || 1,
      query: filters.query || "",
      limit: 20,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
};

export default function CustomersPage() {
  const [data, setData] = useState([]);
  const [sortedRows, setSortedRows] = useState([]);
  const [query, setQuery] = useState("");
  const { admin } = useAdminStore();
  const currentPageRef = useRef(1);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localFilters, setLocalFilters] = useState({
    query: searchParams.get("query") || "",
    page: parseFloat(searchParams.get("page") || "1", 10),
  });

  useEffect(() => {
    const getData = async () => {
      const response = await fetchData(localFilters);
      setData(response);
      setSortedRows(response?.customers);
    };

    getData();
  }, [searchParams]);

  const updateSearchParams = useCallback(
    (newParams) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleRequest = async () => {
    const response = await fetchData({
      page: currentPageRef.current,
      query,
    });
    setData(response);
    setSortedRows(response?.customers);
  };

  const handleLocalFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = useCallback(() => {
    updateSearchParams({ ...localFilters, page: "1" });
  }, [updateSearchParams, localFilters]);

  const handlePageChange = useCallback(
    (newPage) => {
      setLocalFilters((prev) => ({ ...prev, page: newPage }));
      updateSearchParams({ ...localFilters, page: newPage.toString() });
    },
    [updateSearchParams, localFilters]
  );

  const updateUserBlock = async (id, isBlocked) => {
    try {
      const response = await fetch(`${apiUrl}/customer/update/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isBlocked: !isBlocked,
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Статус клиента обновлен." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил статус клиента с ID : ${id}`,
          "UPDATE"
        );

        handleRequest();
      } else {
        ErrorToast({
          errorText: "Произошла ошибка.",
        });
      }
    } catch (err) {
      ErrorToast({
        errorText: "Произошла ошибка.",
      });
    }
  };

  return (
    <div className="flex flex-col mb-4 min-h-[85vh]">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Клиенты</h2>
      </div>
      <div className="bg-support dark:bg-darkTwo border border-support-200 shadow shadow-support-200 rounded mb-2 p-2 pb-4">
        <div className="relative center-row w-full">
          <input
            className="input-primary dark:text-support pl-4 pr-14"
            type="text"
            placeholder="Поиск..."
            value={localFilters.query}
            onChange={(e) => handleLocalFilterChange("query", e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <button
            className="border-l-2 border-support-200 rounded-r center-col absolute right-0 h-10 w-10"
            onClick={() => handleSearch()}
          >
            <Search className="text-dark dark:text-support hover:text-primary size-5" />
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-fixed min-w-[678px] w-full">
            <thead>
              <tr className="border-b border-support-200">
                <th>Номер телефона</th>
                <th>Имя клиента</th>
                <th>Баллы</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows?.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-support-200 cursor-pointer transition hover:bg-white dark:hover:bg-dark"
                  onClick={() => {
                    NProgress.start();
                    router.push(`/home/manage/customers/${row?.id}`);
                  }}
                >
                  <td className="text-left">
                    {row.phoneNumber ? row.phoneNumber : "Нет"}
                  </td>
                  <td>{row.username ? row.username : "Нет"}</td>
                  <td>{row.pointsEarned}</td>
                  <td
                    className={
                      row?.isBlocked ? "text-red-500" : "text-green-500"
                    }
                  >
                    <span className="font-semibold">
                      {row.isBlocked ? "Заблокирован" : "Активен"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="center-row"
                      onClick={() => updateUserBlock(row.id, row.isBlocked)}
                    >
                      {row.isBlocked ? (
                        <Unlock className="h-4 w-4 mr-2" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2" />
                      )}
                      {row.isBlocked ? "Разблокировать" : "Заблокировать"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sortedRows?.length && (
            <div className="bg-blue-200 rounded center-col my-2 p-2 h-20">
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
