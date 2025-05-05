"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiUrl } from "@/components/utils/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";

const notificationSound = new Audio("/bell.mp3");

const fetchOrders = async (filters) => {
  const response = await fetch(`${apiUrl}/orders/current`, {
    method: "POST",
    body: JSON.stringify({
      page: filters.page || 1,
      limit: 99999,
      query: filters?.query,
      orderCityId: filters?.orderCityId || null,
      orderTimeId: filters?.orderTimeId || null,
      orderStatusId: filters?.orderStatusId || null,
      paymentTypeId: filters?.paymentTypeId || null,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
};

const statusClasses = {
  1: "bg-yellow-300",
  2: "bg-blue-300",
  3: "bg-green-300",
  4: "bg-red-300",
};

export default function OrdersTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localFilters, setLocalFilters] = useState({
    query: searchParams.get("query") || "",
    page: parseFloat(searchParams.get("page") || "1", 10),
    orderCityId: searchParams.get("orderCityId") || null,
    orderTimeId: searchParams.get("orderTimeId") || null,
    orderStatusId: searchParams.get("orderStatusId") || null,
    paymentTypeId: searchParams.get("paymentTypeId") || null,
  });

  const [data, setData] = useState({ orders: [], pagination: {} });
  const [isLoading, setIsLoading] = useState(false);
  const previousOrdersRef = useRef([]);

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

  useEffect(() => {
    let isInitialFetch = true;

    const fetchData = async () => {
      try {
        const response = await fetchOrders(localFilters);

        if (
          !isInitialFetch &&
          JSON.stringify(previousOrdersRef.current) !==
            JSON.stringify(response.orders)
        ) {
          if (response.orders.length > previousOrdersRef.current.length) {
            notificationSound
              .play()
              .catch((error) => console.error("Error playing sound:", error));
          }
        }

        setData(response);
        previousOrdersRef.current = response.orders;
      } catch (error) {
        console.error("An error occurred:", error);
      } finally {
        setIsLoading(false);
        isInitialFetch = false;
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [searchParams, localFilters]);

  const handleRequest = async () => {
    try {
      const response = await fetchOrders(localFilters);
      setData(response);
    } catch {
      console.log("Error had happened");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 min-h-[85vh]">
      <div className="center-row gap-1 w-full">
        <input
          className="dark:bg-dark basic-border-2 focus:border-primary dark:text-support outline-none px-2 h-9 md:h-10 w-full"
          type="text"
          placeholder="Поиск (номер заказа, имя и номер клиента, комментарий, адрес)"
          value={localFilters.query}
          onChange={(e) => handleLocalFilterChange("query", e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <button
          onClick={() => handleRequest()}
          className="bg-primary rounded center-row justify-center gap-2 text-white px-2 h-9 md:h-10 w-fit"
        >
          <Search className="size-5" />
          <span className="hidden md:block">Поиск</span>
        </button>
      </div>
      <div>
        {isLoading ? (
          <div className="bg-support dark:bg-dark border border-support-200 shadow shadow-support-200 rounded center-col mt-2 h-28 w-full">
            <p className="animate-pulse">Загрузка...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 h-full">
            {data?.orders?.length > 0 ? (
              data.orders.map((item) => (
                <Link
                  href={`/home/orders/${item.id}`}
                  key={item.id}
                  className={clsx(
                    "border-2 border-gray-300 rounded-lg flex flex-col text-sm transition hover:bg-purple-200 hover:border-purple-400 p-1",
                    statusClasses[item.orderStatusId]
                  )}
                >
                  <div className="center-row justify-between gap-2">
                    <span>Номер заказа</span>
                    <span className="font-bold">{item?.id}</span>
                  </div>
                  <div className="center-row justify-between gap-2">
                    <span>Город</span>
                    <span className="font-bold line-clamp-2 text-right">
                      {item?.OrderCity?.nameRu}
                    </span>
                  </div>
                  <div className="center-row justify-between gap-2">
                    <span>Время заказа</span>
                    <span className="underline font-bold">
                      {item?.OrderTime ? (
                        <>
                          {item?.OrderTime?.nameRu +
                            " " +
                            item?.OrderTime?.time}
                        </>
                      ) : (
                        <>Нет</>
                      )}
                    </span>
                  </div>
                  <div className="center-row justify-between gap-2">
                    <span>Телефон</span>
                    <span className="font-bold">{item?.phoneNumber}</span>
                  </div>
                  <div className="center-row justify-between gap-2">
                    <span>Статус</span>
                    <span className="text-red-400 font-bold">
                      {item?.OrderStatus?.nameRu}
                    </span>
                  </div>
                  <div className="center-row justify-between gap-2">
                    <span>Сумма товаров</span>
                    <span className="text-primary font-bold">
                      {parseFloat(item?.sum).toFixed(2)} M
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-left">Тут Ничего нет</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
