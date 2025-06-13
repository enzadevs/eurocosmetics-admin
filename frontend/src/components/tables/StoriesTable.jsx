"use client";

import * as NProgress from "nprogress";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/components/utils/utils";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

const fetchData = async (filters) => {
  const response = await fetch(`${apiUrl}/stories/all`, {
    method: "POST",
    body: JSON.stringify({
      page: 1,
      limit: 20,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
};

export default function StoriesTable() {
  const [data, setData] = useState([]);
  const [sortedRows, setSortedRows] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchData();
      setData(response);
      setSortedRows(response?.stories);
    };

    getData();
  }, []);

  const filter = (event) => {
    const value = event.target.value.toLowerCase();
    setSortedRows(
      data?.stories?.filter((row) => {
        const joinedValues = Object.values(row).join(" ").toLowerCase();
        return joinedValues.includes(value);
      })
    );
  };

  return (
    <div className="flex flex-col">
      <div className="bg-grey-50 dark:bg-dark-secondary basic-border rounded p-1 md:p-2 pb-4">
        <div className="relative center-row w-full">
          <input
            className="input-primary dark:text-grey-50 pl-2 pr-10"
            type="text"
            placeholder="Поиск..."
            onChange={filter}
          />
          <button className="rounded-r center-col absolute right-0 size-9 md:size-10">
            <Search className="text-dark dark:text-grey-50 hover:text-primary size-5" />
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-fixed min-w-[600px] w-full">
            <thead>
              <tr className="border-bottom">
                <th className="w-20 text-xs md:text-sm">Картина</th>
                <th className="text-xs md:text-sm">Имя</th>
                <th className="text-xs md:text-sm">Номер</th>
                <th className="text-xs md:text-sm">Активен</th>
                <th className="text-xs md:text-sm">Начало</th>
                <th className="text-xs md:text-sm">Конец</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows?.map((row, index) => (
                <tr
                  key={index}
                  onClick={() => {
                    NProgress.start();
                    router.push(`/home/stories/${row.id}`);
                  }}
                  className="bg-grey-100 border-bottom cursor-pointer transition hover:bg-grey-200 dark:hover:bg-dark-accent"
                >
                  <td className="bg-white dark:bg-dark-accent rounded center-col p-1 h-12 w-16">
                    <img
                      src={`${apiUrl}/${row.image}`}
                      width={112}
                      height={112}
                      alt="image of banner"
                      className="object-contain h-full w-auto"
                      crossOrigin="anonymous"
                    />
                  </td>
                  <td className="text-left text-xs md:text-sm">{row.name}</td>
                  <td className="text-left text-xs md:text-sm">{row.order}</td>
                  <td className="text-left text-xs md:text-sm">
                    {row.isActive === true ? "Да" : "Нет"}
                  </td>
                  <td className="text-left text-xs md:text-sm">
                    {row.startDate}
                  </td>
                  <td className="text-left text-xs md:text-sm">
                    {row.endDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sortedRows?.length && (
            <div className="bg-blue-200 dark:bg-dark-accent rounded center-col my-2 p-2 h-20">
              <p>Ничего не нашлось.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
