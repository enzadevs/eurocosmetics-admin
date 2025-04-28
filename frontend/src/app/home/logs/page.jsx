"use client";

import Pagination from "@/components/nav/Pagination";
import BackForthButtons from "@/components/nav/BackForthButtons";
import { apiUrl } from "@/components/utils/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";

const actionTypesArray = [
  { id: 1, action: "Вход" },
  { id: 2, action: "Выход" },
  { id: 3, action: "Создание" },
  { id: 4, action: "Просмотр" },
  { id: 5, action: "Обновление" },
  { id: 6, action: "Удаление" },
];

const fetchData = async (filters = {}) => {
  const response = await fetch(`${apiUrl}/actions/logs/all`, {
    method: "POST",
    body: JSON.stringify({
      query: filters?.query || "",
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

const ActionItem = ({ username, actionDescription, actionType, createdAt }) => {
  return (
    <tr className="border-b border-grey last:border-b-0">
      <td className="py-2 px-4">
        <span className="font-semibold">{username}</span>
      </td>
      <td className="py-2 px-4">
        <span className="text-sm">{actionType}</span>
      </td>
      <td className="py-2 px-4">
        <span className="text-sm">{actionDescription}</span>
      </td>
      <td className="py-2 px-4">
        <span className="text-sm text-dark dark:text-support">{createdAt}</span>
      </td>
    </tr>
  );
};

export default function ActionLogsPage() {
  const [data, setData] = useState([]);
  const [sortedRows, setSortedRows] = useState([]);
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
      setSortedRows(response?.actions);
    };

    getData();
  }, [searchParams]);

  const getActionType = (actionType) => {
    const foundAction = actionTypesArray.find(
      (item) => item.action.toLowerCase() === actionType.toLowerCase()
    );
    return foundAction ? foundAction.action : actionType;
  };

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

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Действия пользователей</h2>
      </div>

      <div className="flex flex-col items-center mb-2 min-h-[70vh]">
        <div className="relative center-row mb-2 w-full max-w-4xl">
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
        <div className="basic-border flex flex-col h-fit w-full max-w-4xl overflow-x-auto">
          <table className="min-w-[768px] w-full">
            <thead>
              <tr className="bg-support dark:bg-darkTwo border-b border-grey">
                <th className="text-left py-2 px-4 w-1/4">
                  <span className="text-sm font-semibold">Пользователь</span>
                </th>
                <th className="text-left py-2 px-4 w-1/6">
                  <span className="text-sm font-semibold">Действие</span>
                </th>
                <th className="text-left py-2 px-4 w-1/3">
                  <span className="text-sm font-semibold">Описание</span>
                </th>
                <th className="text-left py-2 px-4 w-1/6">
                  <span className="text-sm font-semibold">Дата</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows?.map((action) => (
                <ActionItem
                  key={action.id}
                  username={action.username}
                  actionDescription={action.actionDescription}
                  actionType={getActionType(action.actionType)}
                  createdAt={action.createdAt}
                />
              ))}
            </tbody>
          </table>
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
