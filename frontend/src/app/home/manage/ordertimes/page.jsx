"use client";

import BackForthButtons from "@/components/nav/BackForthButtons";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl, SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Switch,
} from "@headlessui/react";
import { ChevronDown } from "lucide-react";

const fetchOrderTimes = async () => {
  const response = await fetch(`${apiUrl}/ordertimes/fetch/all`);
  const data = await response.json();
  return data;
};

const sortOrderTimes = (orderTimes) => {
  return orderTimes.sort((a, b) => {
    if (a.nameTm > b.nameTm) return -1;
    if (a.nameTm < b.nameTm) return 1;

    const [startA] = a.time.split(" - ");
    const [startB] = b.time.split(" - ");
    return startA.localeCompare(startB);
  });
};

export default function OrderTimesPage() {
  const [orderTimes, setOrderTimes] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [activeStates, setActiveStates] = useState({});
  const { register, handleSubmit } = useForm();
  const { admin } = useAdminStore();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchOrderTimes();
      const sortedOrderTimes = sortOrderTimes(response.orderTimes);

      setOrderTimes(sortedOrderTimes);

      const initialStates = {};
      sortedOrderTimes.forEach((item) => {
        initialStates[item.id] = item.isActive;
      });
      setActiveStates(initialStates);
    };

    getData();
  }, []);

  const handlePageRefresh = async () => {
    const response = await fetchOrderTimes();
    const sortedOrderTimes = sortOrderTimes(response?.orderTimes);
    setOrderTimes(sortedOrderTimes);
  };

  const createNewOrderTime = async (data) => {
    if (!data.nameTm) {
      ErrorToast({
        errorText: "Введите имя на туркменском.",
      });
      return;
    }

    if (!data.nameRu) {
      ErrorToast({
        errorText: "Введите имя на русском.",
      });
      return;
    }

    if (!data.time) {
      ErrorToast({
        errorText: "Введите время.",
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/ordertimes/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nameTm: data.nameTm,
          nameRu: data.nameRu,
          time: data.time,
          limit: data.limit,
          isActive: isActive,
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Добавлено время доставки." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Создал новое время доставки : ${data.nameRu} / ${data.time}`,
          "CREATE"
        );

        const refreshResponse = await fetchOrderTimes();
        const sortedOrderTimes = sortOrderTimes(refreshResponse?.orderTimes);
        setOrderTimes(sortedOrderTimes);
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const updateOrderTime = async (data, id) => {
    try {
      const response = await fetch(`${apiUrl}/ordertimes/update/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nameTm: data.orderTimes[id]?.nameTm || "",
          nameRu: data.orderTimes[id]?.nameRu || "",
          time: data.orderTimes[id]?.time || "",
          limit: data.orderTimes[id]?.limit || "",
          isActive: activeStates[id],
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Время доставки обновлено." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил время доставки с ID : ${id}`,
          "UPDATE"
        );

        handlePageRefresh();
      } else {
        ErrorToast({
          errorText: "Произошла ошибка при обновлении времени доставки.",
        });
      }
    } catch (err) {
      console.error(err);
      ErrorToast({
        errorText: "Произошла ошибка при обновлении времени доставки.",
      });
    }
  };

  const toggleIsActive = (id) => {
    setActiveStates((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Время доставки</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <div className="basic-border flex flex-col gap-2 p-2 h-fit w-full md:w-1/2">
          {orderTimes?.map((item) => {
            return (
              <Disclosure
                key={item.id}
                as="div"
                className="border-b border-support-200 flex flex-col gap-2 px-2 h-fit w-full"
                defaultOpen={false}
              >
                <DisclosureButton className="group flex items-center justify-between h-9 w-full">
                  <p>
                    {item.nameTm} / {item.nameRu} / {item.time}
                  </p>
                  <ChevronDown className="dark:text-support size-5 group-data-[open]:rotate-180" />
                </DisclosureButton>
                <DisclosurePanel>
                  <form
                    key={item.id}
                    className="flex flex-col gap-2 w-full"
                    onSubmit={handleSubmit((data) =>
                      updateOrderTime(data, item.id)
                    )}
                  >
                    <input
                      type="text"
                      className="input-primary dark:text-support px-4 w-full"
                      defaultValue={item.nameTm}
                      placeholder="Время доставки (ткм.)"
                      {...register(`orderTimes.${item.id}.nameTm`)}
                    />
                    <input
                      type="text"
                      className="input-primary dark:text-support px-4 w-full"
                      defaultValue={item.nameRu}
                      placeholder="Время доставки (ру.)"
                      {...register(`orderTimes.${item.id}.nameRu`)}
                    />
                    <input
                      type="number"
                      className="input-primary dark:text-support px-4 w-full"
                      defaultValue={item.limit}
                      placeholder="Лимит"
                      {...register(`orderTimes.${item.id}.limit`)}
                    />
                    <input
                      type="text"
                      className="input-primary dark:text-support px-4 w-full"
                      defaultValue={item.time}
                      placeholder="Время доставки (часы)"
                      {...register(`orderTimes.${item.id}.time`)}
                    />
                    <div className="bg-white dark:bg-dark basic-border center-row gap-4 p-2 h-9 w-full">
                      <p className="w-52">Время доставки доступна:</p>
                      <Switch
                        checked={activeStates[item.id]}
                        onChange={() => toggleIsActive(item.id)}
                        className="group relative flex cursor-pointer rounded-full bg-support dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                      >
                        <span
                          aria-hidden="true"
                          className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                        />
                      </Switch>
                    </div>
                    <button type="submit" className="btn-primary mb-2">
                      <span className="font-semibold">Сохранить</span>
                    </button>
                  </form>
                </DisclosurePanel>
              </Disclosure>
            );
          })}
        </div>
        <Disclosure
          as="div"
          className="bg-white dark:bg-darkTwo basic-border flex flex-col gap-2 px-2 pb-2 h-fit w-full md:w-1/2"
          defaultOpen={false}
        >
          <DisclosureButton className="group flex items-center justify-between h-9 w-full">
            <p className="font-bold">Добавить новое время доставки</p>
            <ChevronDown className="dark:text-support size-5 group-data-[open]:rotate-180" />
          </DisclosureButton>
          <DisclosurePanel>
            <form
              onSubmit={handleSubmit(createNewOrderTime)}
              className="flex flex-col gap-2 w-full"
            >
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Имя (ткм.)"
                {...register("nameTm")}
              />
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Имя (ру.)"
                {...register("nameRu")}
              />
              <input
                type="number"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Лимит"
                {...register("limit")}
              />
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Время доставки"
                {...register("time")}
              />
              <div className="bg-white dark:bg-dark basic-border center-row gap-4 p-2 h-9 md:h-10 w-full">
                <p className="w-52">Время доставки доступна:</p>
                <Switch
                  checked={isActive}
                  onChange={() => {
                    setIsActive(!isActive);
                  }}
                  className="group relative flex cursor-pointer rounded-full bg-support-100 p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                  />
                </Switch>
              </div>
              <button className="btn-primary">
                <span className="font-semibold">Добавить</span>
              </button>
            </form>
          </DisclosurePanel>
        </Disclosure>
      </div>
    </div>
  );
}
