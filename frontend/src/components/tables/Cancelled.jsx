"use client";

import clsx from "clsx";
import Link from "next/link";
import QueriedPagination from "../nav/QueriedPagination";
import { useRouter, useSearchParams } from "next/navigation";
import { apiUrl } from "@/components/utils/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";

const notificationSound = new Audio("/bell.mp3");

const fetchOrders = async (filters) => {
  const response = await fetch(`${apiUrl}/orders/cancelled`, {
    method: "POST",
    body: JSON.stringify({
      page: filters.page || 1,
      limit: 20,
      query: filters?.query,
      orderCityId: filters?.orderCityId || null,
      orderTimeId: filters?.orderTimeId || null,
      orderStatusId: filters?.orderStatusId || null,
      paymentTypeId: filters?.paymentTypeId || null,
      deliveryTypeId: filters?.deliveryTypeId || null,
      searchPhoneNumber: filters?.searchPhoneNumber || null,
      searchStreet: filters?.searchStreet || null,
      searchComment: filters?.searchComment || null,
      minPrice: filters?.minPrice || null,
      maxPrice: filters?.maxPrice || null,
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
  5: "bg-sky-300",
};

export default function CancelledOrdersTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localFilters, setLocalFilters] = useState({
    query: searchParams.get("query") || "",
    page: parseFloat(searchParams.get("page") || "1", 10),
    orderCityId: searchParams.get("orderCityId") || null,
    orderTimeId: searchParams.get("orderTimeId") || null,
    orderStatusId: searchParams.get("orderStatusId") || null,
    paymentTypeId: searchParams.get("paymentTypeId") || null,
    deliveryTypeId: searchParams.get("deliveryTypeId") || null,
    searchPhoneNumber: searchParams.get("searchPhoneNumber") || null,
    searchStreet: searchParams.get("searchStreet") || null,
    searchComment: searchParams.get("searchComment") || null,
    minPrice: searchParams.get("minPrice") || null,
    maxPrice: searchParams.get("maxPrice") || null,
  });

  const [data, setData] = useState({ orders: [], pagination: {} });

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

  const [isLoading, setIsLoading] = useState(false);
  const previousOrdersRef = useRef([]);

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
  }, [searchParams]);

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

  const formatDate = (dateString) => {
    const [date, time] = dateString.split(", ");
    const formattedDate = date.replace("/", ".").replace("/", ".");
    return `${formattedDate} (${time})`;
  };

  return (
    <div className="flex flex-col gap-2 min-h-[85vh]">
      <div className="center-row gap-1 w-full">
        <input
          className="input-primary dark:text-support px-2 h-9 md:h-10 w-full"
          type="text"
          placeholder="Поиск по номеру заказа"
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
          <div className="bg-support border border-support-200 shadow shadow-support-200 rounded center-col mt-2 h-28 w-full">
            <p className="animate-pulse">Загрузка...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-2">
            {data?.orders.map((item) => (
              <Link
                href={`/home/orders/${item.id}`}
                key={item.id}
                className={clsx(
                  "border-2 border-transparent rounded flex flex-col text-sm transition hover:border-violet-500 p-2 w-full",
                  statusClasses[item.orderStatusId]
                )}
              >
                <div className="center-row justify-center">
                  <span className="font-bold">№ {item?.id} /</span>
                  <span className="font-medium">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <div className="center-row justify-center">
                  <span className="font-bold">{item?.phoneNumber}</span>
                </div>
                <div className="center-row justify-center">
                  <span className="font-bold">{item?.OrderStatus?.nameRu}</span>
                </div>
                <div className="center-row justify-center">
                  <span className="font-bold">
                    {formatDate(item.createdAt).slice(0, 10)} /{" "}
                    {item?.OrderTime
                      ? `${item?.OrderTime?.time}`
                      : item?.DeliveryType?.nameRu}
                  </span>
                </div>
                <div className="center-row justify-center">
                  <span className="font-bold">
                    {item?.DeliveryType?.nameRu}
                  </span>
                </div>
                <div className="center-row justify-center">
                  <span className="font-bold italic underline">
                    {parseFloat(item?.sum).toFixed(2)} M
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <QueriedPagination
        currentPage={localFilters.page}
        totalPages={data?.pagination?.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
