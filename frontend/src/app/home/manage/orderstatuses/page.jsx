"use client";

import BackForthButtons from "@/components/nav/BackForthButtons";
import { apiUrl } from "@/components/utils/utils";
import { useState, useEffect } from "react";

const fetchOrderStatuses = async () => {
  const response = await fetch(`${apiUrl}/orderstatuses/fetch/all`);
  const data = await response.json();
  return data;
};

export default function OrderStatusesPage() {
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const getData = async () => {
      const response = await fetchOrderStatuses();
      setStatuses(response?.orderStatuses?.sort((a, b) => a.id - b.id));
    };

    getData();
  }, []);

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Статусы заказов</h2>
      </div>
      <div className="center-col">
        <div className="basic-border flex flex-col px-2 pb-2 h-fit w-full max-w-2xl">
          <div className="border-b border-support-200 center-row justify-between h-9 w-full">
            <p className="font-bold md:w-1/2">Имя (ру)</p>
            <p className="font-bold md:w-1/2">Имя (ткм)</p>
          </div>
          <div className="flex flex-col items-center justify-between h-full">
            {statuses?.map((item) => {
              return (
                <div
                  className="border-b border-support-200 center-row justify-between h-9 w-full"
                  key={item.id}
                >
                  <p className="md:w-1/2">{item.nameRu}</p>
                  <p className="md:w-1/2">{item.nameTm} </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
