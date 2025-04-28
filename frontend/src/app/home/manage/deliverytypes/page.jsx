"use client";

import BackForthButtons from "@/components/nav/BackForthButtons";
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

const fetchDeliveryTypes = async () => {
  const response = await fetch(`${apiUrl}/deliverytypes/fetch/admin`);
  const data = await response.json();
  return data;
};

export default function DeliveryTypesPage() {
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [activeStates, setActiveStates] = useState({});
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchDeliveryTypes();
      setDeliveryTypes(response?.deliveryTypes);

      const initialStates = {};
      response.deliveryTypes.forEach((item) => {
        initialStates[item.id] = item.isActive;
      });
      setActiveStates(initialStates);
    };

    getData();
  }, []);

  const handlePageRefresh = async () => {
    const response = await fetchDeliveryTypes();
    setDeliveryTypes(response?.deliveryTypes);
  };

  const updateDeliveryType = async (data, id) => {
    if (!data.deliveryTypes[id]?.nameTm) {
      ErrorToast({
        errorText: "Дайте название доставке на туркменском языке.",
      });
      return;
    }

    if (!data.deliveryTypes[id]?.nameRu) {
      ErrorToast({
        errorText: "Дайте название доставке на русском языке.",
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/deliverytypes/update/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nameTm: data.deliveryTypes[id]?.nameTm || "",
          nameRu: data.deliveryTypes[id]?.nameRu || "",
          isActive: activeStates[id],
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Способ доставки обновлено." });
        handlePageRefresh();
      } else {
        ErrorToast({
          errorText: "Произошла ошибка при обновлении способа доставки.",
        });
      }
    } catch (err) {
      console.error(err);
      ErrorToast({
        errorText: "Произошла ошибка при обновлении способа доставки.",
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
        <h2>Способ доставки</h2>
      </div>
      <div className="center-col">
        <div className="basic-border flex flex-col px-2 pb-2 h-fit w-full max-w-2xl">
          {deliveryTypes
            ?.sort((a, b) => a.id - b.id)
            ?.map((item) => {
              return (
                <Disclosure
                  key={item.id}
                  as="div"
                  className="border-b-2 border-support-200 flex flex-col gap-2 h-fit w-full"
                  defaultOpen={false}
                >
                  <DisclosureButton className="group flex items-center justify-between h-10 w-full">
                    <span className="text-dark dark:text-white font-medium">
                      {item.nameTm} / {item.nameRu}
                    </span>
                    <ChevronDown className="dark:text-white size-5 group-data-[open]:rotate-180" />
                  </DisclosureButton>
                  <DisclosurePanel>
                    <form
                      key={item.id}
                      className="flex flex-col gap-2 w-full"
                      onSubmit={handleSubmit((data) =>
                        updateDeliveryType(data, item.id)
                      )}
                    >
                      <input
                        type="text"
                        className="input-primary dark:text-grey-200 px-2 w-full"
                        defaultValue={item.nameTm}
                        placeholder="Способ доставки (ткм.)"
                        {...register(`deliveryTypes.${item.id}.nameTm`)}
                      />
                      <input
                        type="text"
                        className="input-primary dark:text-grey-200 px-2 w-full"
                        defaultValue={item.nameRu}
                        placeholder="Способ доставки (ру.)"
                        {...register(`deliveryTypes.${item.id}.nameRu`)}
                      />
                      <div className="basic-border-2 center-row gap-4 p-2 h-10 w-full">
                        <p className="text-dark dark:text-grey-200 w-52">
                          Время доставки доступна:
                        </p>
                        <Switch
                          checked={activeStates[item.id]}
                          onChange={() => toggleIsActive(item.id)}
                          className="group relative flex cursor-pointer rounded-full bg-support-100 p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                        >
                          <span
                            aria-hidden="true"
                            className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                          />
                        </Switch>
                      </div>
                      <button
                        type="submit"
                        className="btn-primary mb-2 dark:text-grey-200 px-2 h-10 w-full"
                      >
                        <span className="font-semibold">Сохранить</span>
                      </button>
                    </form>
                  </DisclosurePanel>
                </Disclosure>
              );
            })}
        </div>
      </div>
    </div>
  );
}
