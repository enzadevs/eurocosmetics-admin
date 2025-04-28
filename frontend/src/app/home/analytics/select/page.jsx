"use client";

import BackForthButtons from "@/components/nav/BackForthButtons";
import { apiUrl } from "@/components/utils/utils";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Receipt, ShoppingCart, HandCoins, CalendarSearch } from "lucide-react";

const fetchDateRangeData = async (data) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const formatDate = (date) => date.toISOString().split("T")[0];
  const startDate = data?.startDate || formatDate(startOfMonth);
  const endDate = data?.endDate || formatDate(endOfMonth);

  const response = await fetch(`${apiUrl}/analytics/daterange`, {
    method: "POST",
    body: JSON.stringify({ startDate, endDate }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.log("Fetch Failed");
  }

  const rangeData = await response.json();
  return rangeData;
};

export default function SelectDateRangePage() {
  const [initialData, setInitialData] = useState([]);
  const [data, setData] = useState([]);
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchDateRangeData();
      setInitialData(response);
    };

    getData();
  }, []);

  const handleRequest = async (formData) => {
    try {
      const response = await fetchDateRangeData(formData);

      setData(response);
    } catch (err) {
      console.error("Failed to fetch date range data:", err);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Выбрать дату</h2>
      </div>
      <div className="basic-border flex flex-col gap-2 p-2 pb-4">
        <form
          onSubmit={handleSubmit(handleRequest)}
          className="flex flex-col sm:flex-row items-center gap-2 w-full"
        >
          <div className="center-row gap-1 w-full">
            <p className="min-w-16">Начало</p>
            <input
              type="date"
              className="input-primary dark:text-support px-4 w-full"
              defaultValue=""
              placeholder="Начало"
              {...register("startDate", { required: true })}
            />
          </div>
          <div className="center-row gap-1 w-full">
            <p className="min-w-16">Конец</p>
            <input
              type="date"
              className="input-primary dark:text-support px-4 w-full"
              defaultValue=""
              placeholder="Конец"
              {...register("endDate", { required: true })}
            />
          </div>
          <button className="btn-primary center-row justify-center gap-2 px-2 w-full md:w-40">
            <CalendarSearch className="dark:text-support size-5" />
            <span className="font-semibold">Поиск</span>
          </button>
        </form>
        <div className="center-row gap-2">
          <div className="flex items-center flex-col md:flex-row gap-2 w-full">
            <div className="short-sum-box">
              <div className="flex flex-col flex-[75%] h-full max-w-[75%]">
                <p className="border-b flex items-center pl-4 h-8">
                  Общая сумма
                </p>
                <div className="center-col grow">
                  <p className="font-semibold text-lg lg:text-xl">
                    {data?.totalSum
                      ? parseFloat(data?.totalSum).toFixed(2) + " М"
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
                    {data?.totalIncomeValue
                      ? parseFloat(data?.totalIncomeValue).toFixed(2) + " М"
                      : "0 М"}
                  </p>
                </div>
              </div>
              <span className="border-l center-col flex-[25%] h-full max-w-[25%]">
                <HandCoins className="dark:text-support h-6 w-6 lg:h-12 lg:w-10" />
              </span>
            </div>
            <div className="short-sum-box">
              <div className="flex flex-col flex-[75%] h-full max-w-[75%]">
                <p className="border-b flex items-center pl-4 h-8">Заказы</p>
                <div className="center-col grow">
                  <p className="font-semibold text-lg lg:text-xl">
                    {data?.orderCount ? data?.orderCount : 0}
                  </p>
                </div>
              </div>
              <span className="border-l center-col flex-[25%] h-full max-w-[25%]">
                <ShoppingCart className="dark:text-support h-6 w-6 lg:h-12 lg:w-10" />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="basic-border flex flex-col gap-2 mt-2 p-2">
        <h2>Текущий месяц</h2>
        <div className="center-row gap-2">
          <div className="flex items-center flex-col md:flex-row gap-2 w-full">
            <div className="short-sum-box">
              <div className="flex flex-col flex-[75%] h-full max-w-[75%]">
                <p className="border-b flex items-center pl-4 h-8">
                  Общая сумма
                </p>
                <div className="center-col grow">
                  <p className="font-semibold text-lg lg:text-xl">
                    {initialData?.totalSum
                      ? parseFloat(initialData?.totalSum).toFixed(2) + " М"
                      : 0}
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
                    {initialData?.totalIncomeValue
                      ? parseFloat(initialData?.totalIncomeValue).toFixed(2) +
                        " М"
                      : 0}
                  </p>
                </div>
              </div>
              <span className="border-l center-col flex-[25%] h-full max-w-[25%]">
                <HandCoins className="dark:text-support h-6 w-6 lg:h-12 lg:w-10" />
              </span>
            </div>
            <div className="short-sum-box">
              <div className="flex flex-col flex-[75%] h-full max-w-[75%]">
                <p className="border-b flex items-center pl-4 h-8">Заказы</p>
                <div className="center-col grow">
                  <p className="font-semibold text-lg lg:text-xl">
                    {initialData?.orderCount ? initialData?.orderCount : 0}
                  </p>
                </div>
              </div>
              <span className="border-l center-col flex-[25%] h-full max-w-[25%]">
                <ShoppingCart className="dark:text-support h-6 w-6 lg:h-12 lg:w-10" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
