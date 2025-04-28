"use client";

import BackForthButtons from "@/components/nav/BackForthButtons";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Switch,
} from "@headlessui/react";
import { ChevronDown } from "lucide-react";

const fetchRegions = async () => {
  const response = await fetch(`${apiUrl}/cities/fetch/admin`);
  const data = await response.json();
  return data;
};

export default function RegionsPage() {
  const [isActive, setIsActive] = useState(true);
  const [orderRegion, setOrderRegion] = useState([]);
  const [activeStates, setActiveStates] = useState({});
  const { register, handleSubmit } = useForm();
  const {
    register: registerNewRegion,
    handleSubmit: handleSubmitNewRegion,
    reset: resetRegion,
  } = useForm();
  const { admin } = useAdminStore();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchRegions();
      setOrderRegion(response?.orderCities);
      const initialStates = {};
      response?.orderCities?.forEach((item) => {
        initialStates[item.id] = item.isActive;
      });
      setActiveStates(initialStates);
    };

    getData();
  }, []);

  const handlePageRefresh = async () => {
    const response = await fetchRegions();
    setOrderRegion(response?.orderCities);
  };

  const createNewRegion = async (data) => {
    if (!data.nameTm) {
      ErrorToast({
        errorText: "Введите имя региона на туркменском.",
      });
      return;
    }

    if (!data.nameRu) {
      ErrorToast({
        errorText: "Введите имя региона на русском.",
      });
      return;
    }

    if (!data.price) {
      ErrorToast({
        errorText: "Введите цену доставки региона на русском.",
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/cities/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nameTm: data.nameTm,
          nameRu: data.nameRu,
          price: data.price,
          isActive: true,
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Добавлен новый регион." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Создал новый регион : ${data.nameRu}`,
          "CREATE"
        );

        handlePageRefresh();
        resetRegion();
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const updateRegion = async (data, id) => {
    if (!data.orderRegion[id].nameTm) {
      ErrorToast({
        errorText: "Введите имя на туркменском языке.",
      });
      return;
    }

    if (!data.orderRegion[id].nameRu) {
      ErrorToast({
        errorText: "Введите имя на русском языке.",
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/cities/update/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nameTm: data.orderRegion[id]?.nameTm || "",
          nameRu: data.orderRegion[id]?.nameRu || "",
          price: data.orderRegion[id]?.price || "",
          isActive: activeStates[id],
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Успешно обновлено." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил регион с ID : ${id}`,
          "UPDATE"
        );

        handlePageRefresh();
      } else {
        ErrorToast({
          errorText: "Произошла ошибка при обновлении.",
        });
      }
    } catch (err) {
      console.error(err);
      ErrorToast({
        errorText: "Произошла ошибка при обновлении.",
      });
    }
  };

  const toggleIsActive = (id) => {
    setActiveStates((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const sortedCities = orderRegion?.slice().sort((a, b) => a.id - b.id);

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Управление регионами</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <div className="basic-border flex flex-col gap-2 p-1 h-fit w-full md:w-1/2">
          {sortedCities?.map((item) => {
            return (
              <Disclosure
                key={item.id}
                as="div"
                className="dark:bg-darkTwo basic-border flex flex-col gap-2 px-2 h-fit w-full"
                defaultOpen={false}
              >
                <DisclosureButton className="group flex items-center justify-between h-10 w-full">
                  <p className="font-medium">
                    {item.nameTm} / {item.nameRu} / {item?.price} M
                  </p>
                  <ChevronDown className="dark:text-white size-5 group-data-[open]:rotate-180" />
                </DisclosureButton>
                <DisclosurePanel>
                  <form
                    key={item.id}
                    className="flex flex-col gap-2 w-full"
                    onSubmit={handleSubmit((data) =>
                      updateRegion(data, item.id)
                    )}
                  >
                    <input
                      type="text"
                      className="input-primary dark:text-support px-4 w-full"
                      defaultValue={item.nameTm}
                      placeholder="Регион (ткм.)"
                      {...register(`orderRegion.${item.id}.nameTm`)}
                    />
                    <input
                      type="text"
                      className="input-primary dark:text-support px-4 w-full"
                      defaultValue={item.nameRu}
                      placeholder="Регион (ру.)"
                      {...register(`orderRegion.${item.id}.nameRu`)}
                    />
                    <input
                      type="number"
                      className="input-primary dark:text-support px-4 w-full"
                      defaultValue={item.price}
                      placeholder="Цена доставки"
                      {...register(`orderRegion.${item.id}.price`)}
                    />
                    <div className="bg-white dark:bg-dark basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
                      <p className="w-52">Регион доступен:</p>
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
          className="basic-border flex flex-col gap-2 px-1 h-fit w-full md:w-1/2"
          defaultOpen={false}
        >
          <DisclosureButton className="group flex items-center justify-between h-9 md:h-10 w-full">
            <span className="text-dark dark:text-support font-bold">
              Добавить новый регион
            </span>
            <ChevronDown className="dark:text-support size-5 group-data-[open]:rotate-180" />
          </DisclosureButton>
          <DisclosurePanel>
            <form
              onSubmit={handleSubmitNewRegion(createNewRegion)}
              className="flex flex-col gap-2 w-full"
            >
              <input
                type="text"
                className="input-primary dark:text-support px-4 w-full"
                defaultValue=""
                placeholder="Регион (ткм.)"
                {...registerNewRegion("nameTm")}
              />
              <input
                type="text"
                className="input-primary dark:text-support px-4 w-full"
                defaultValue=""
                placeholder="Регион (ру.)"
                {...registerNewRegion("nameRu")}
              />
              <input
                type="number"
                className="input-primary dark:text-support px-4 w-full"
                defaultValue=""
                placeholder="Цена доставки"
                {...registerNewRegion("price")}
              />
              <div className="bg-white dark:bg-dark basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
                <p className=" w-52">Регион активен:</p>
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
              <button className="btn-primary mb-2">
                <span className="font-semibold">Добавить</span>
              </button>
            </form>
          </DisclosurePanel>
        </Disclosure>
      </div>
    </div>
  );
}
