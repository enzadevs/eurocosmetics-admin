"use client";

import useSWR from "swr";
import { apiUrl } from "../utils/utils";
import { Receipt, ShoppingCart, HandCoins, UsersRound } from "lucide-react";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function TodaysSum() {
  const {
    data: responseOne,
    error: errorOne,
    isLoading: loadingOne,
  } = useSWR(`${apiUrl}/analytics/revenue/today`, fetcher, {
    refreshInterval: 30000,
  });

  const {
    data: responseTwo,
    error: errorTwo,
    isLoading: loadingTwo,
  } = useSWR(`${apiUrl}/visitor/today`, fetcher, {
    refreshInterval: 30000,
  });

  const {
    data: stats,
    error,
    isLoading,
  } = useSWR(`${apiUrl}/analytics/orders/today`, fetcher, {
    refreshInterval: 30000,
  });

  if (isLoading) return <></>;
  if (error) return <></>;

  return (
    <div className="bg-support dark:bg-darkTwo basic-border flex flex-col gap-2 p-2 w-full">
      <h2>Сегодня</h2>
      <div className="center-row gap-2">
        <div className="flex items-center flex-col md:flex-row gap-2 flex-[50%] max-w-[50%] w-full">
          <div className="short-sum-box">
            <div className="flex flex-col flex-[75%] h-full max-w-[75%]">
              <p className="border-b flex items-center pl-4 h-8">Общая сумма</p>
              <div className="center-col grow">
                <p className="font-semibold text-lg lg:text-xl">
                  {stats?.overallSum
                    ? parseFloat(stats?.overallSum).toFixed(2) + " М"
                    : "0 М"}
                </p>
              </div>
            </div>
            <span className="border-l center-col flex-[25%] h-full max-w-[25%]">
              <Receipt className="dark:text-support h-6 w-6 lg:h-12 lg:w-10" />
            </span>
          </div>
          <div className="short-sum-box">
            <div className="flex flex-col flex-[75%] h-full max-w-[75%]">
              <p className="border-b flex items-center pl-4 h-8">Прибыль</p>
              <div className="center-col grow">
                <p className="font-semibold text-lg lg:text-xl">
                  {responseOne?.revenue
                    ? parseFloat(responseOne?.revenue).toFixed(2) + " М"
                    : "0 М"}
                </p>
              </div>
            </div>
            <span className="border-l center-col flex-[25%] h-full max-w-[25%]">
              <HandCoins className="dark:text-support h-6 w-6 lg:h-12 lg:w-10" />
            </span>
          </div>
        </div>
        <div className="flex items-center flex-col md:flex-row gap-2 flex-[50%] max-w-[50%] w-full">
          <div className="short-sum-box">
            <div className="flex flex-col flex-[75%] h-full max-w-[75%]">
              <p className="border-b flex items-center pl-4 h-8">Заказы</p>
              <div className="center-col grow">
                <p className="font-semibold text-lg lg:text-xl">
                  {stats?.ordersCount ? stats?.ordersCount : 0}
                </p>
              </div>
            </div>
            <span className="border-l center-col flex-[25%] h-full max-w-[25%]">
              <ShoppingCart className="dark:text-support h-6 w-6 lg:h-12 lg:w-10" />
            </span>
          </div>

          <div className="short-sum-box">
            <div className="flex flex-col flex-[75%] h-full max-w-[75%]">
              <p className="border-b flex items-center pl-4 h-8">Посетители</p>
              <div className="center-col grow">
                <p className="font-semibold text-lg lg:text-xl">
                  {responseTwo ? responseTwo : 0}
                </p>
              </div>
            </div>
            <span className="border-l center-col flex-[25%] h-full max-w-[25%]">
              <UsersRound className="dark:text-support h-6 w-6 lg:h-12 lg:w-10" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
