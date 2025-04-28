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
      deliveryTypeId: filters?.deliveryTypeId || null,
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
    deliveryTypeId: searchParams.get("deliveryTypeId") || null,
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

  const groupAndSortOrders = (orders) => {
    const expressOrders = [];
    const regularDeliveryOrders = [];
    const selfPickupOrders = [];

    orders.forEach((order) => {
      if (order.DeliveryType?.id === 3) {
        expressOrders.push(order);
      } else if (order.DeliveryType?.id === 2) {
        selfPickupOrders.push(order);
      } else {
        regularDeliveryOrders.push(order);
      }
    });

    const groupByTime = (ordersList) => {
      return ordersList.reduce((groups, order) => {
        const key = order.OrderTime?.id || "NoTime";
        if (!groups[key]) {
          groups[key] = {
            orderTime: order.OrderTime,
            orders: [],
            deliveryType: order.DeliveryType,
          };
        }
        groups[key].orders.push(order);
        return groups;
      }, {});
    };

    const expressGroups = groupByTime(expressOrders);
    const regularGroups = groupByTime(regularDeliveryOrders);
    const selfPickupGroups = groupByTime(selfPickupOrders);

    return {
      express: {
        groups: expressGroups,
        title: "Экспресс доставка",
        bgColor: "bg-red-400",
      },
      regular: {
        groups: regularGroups,
        title: "Обычная доставка",
        bgColor: "bg-primary-400",
      },
      selfPickup: {
        groups: selfPickupGroups,
        title: "Самовывоз",
        bgColor: "bg-grey-200",
      },
    };
  };

  const sortTimeGroups = (groups) => {
    return Object.values(groups).sort((a, b) => {
      const dayOrder = ["Сегодня", "Завтра"];
      const hasTimeA = !!a.orderTime;
      const hasTimeB = !!b.orderTime;

      if (!hasTimeA && !hasTimeB) return 0;
      if (!hasTimeA) return 1;
      if (!hasTimeB) return -1;

      const dayComparison =
        dayOrder.indexOf(a.orderTime.nameRu) -
        dayOrder.indexOf(b.orderTime.nameRu);

      if (dayComparison !== 0) return dayComparison;
      const timeA = a.orderTime.time.split(" - ")[0];
      const timeB = b.orderTime.time.split(" - ")[0];
      return timeA.localeCompare(timeB);
    });
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
          <div className="flex flex-col mt-2">
            <div className="flex flex-wrap gap-2">
              {data?.orders?.length > 0 ? (
                Object.entries(groupAndSortOrders(data.orders)).map(
                  ([type, { groups, title, bgColor }]) => (
                    <div key={type} className="flex flex-col gap-0 w-full">
                      <h2
                        className={clsx(
                          "text-lg font-bold p-2 rounded",
                          bgColor
                        )}
                      >
                        {title}
                      </h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sortTimeGroups(groups).map((group, index) => (
                          <div
                            key={index}
                            className={clsx(
                              "rounded flex flex-col gap-2 p-2 h-fit w-full sm:w-[calc(50%-1rem)] lg:w-[calc(20%-1rem)] xl:w-[calc(17%-1rem)]",
                              bgColor,
                              "dark:bg-darkTwo"
                            )}
                          >
                            <div className="center-row justify-between">
                              <div className="text-sm font-medium text-dark">
                                {group.orders.length > 0 &&
                                  group.orders[0]?.createdAt.slice(0, 10)}
                              </div>
                              <div className="text-sm font-bold text-dark text-end">
                                {group.orderTime
                                  ? `${group.orderTime.nameRu} / ${group.orderTime.time}`
                                  : "Без времени"}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {group.orders.map((item) => (
                                <Link
                                  href={`/home/orders/${item.id}`}
                                  key={item.id}
                                  className={clsx(
                                    "border-2 border-transparent rounded flex flex-col text-sm transition hover:border-violet-500 p-2",
                                    statusClasses[item.orderStatusId]
                                  )}
                                >
                                  <div className="center-row justify-center">
                                    <span className="font-bold">
                                      № {item?.id} /
                                    </span>
                                    <span className="font-medium">
                                      {formatDate(item.createdAt)}
                                    </span>
                                  </div>
                                  <div className="center-row justify-center">
                                    <span className="font-bold">
                                      {item?.phoneNumber}
                                    </span>
                                  </div>
                                  <div className="center-row justify-center">
                                    <span className="font-bold">
                                      {item?.OrderStatus?.nameRu}
                                    </span>
                                  </div>
                                  <div className="center-row justify-center">
                                    <span className="font-bold">
                                      {formatDate(item.createdAt).slice(0, 10)}{" "}
                                      /{" "}
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )
              ) : (
                <p>Тут Ничего нет</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
