"use client";

import clsx from "clsx";
import BackForthButtons from "@/components/nav/BackForthButtons";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Description, Field, Textarea, Switch } from "@headlessui/react";
import { Save } from "lucide-react";

const fetchInfo = async () => {
  const response = await fetch(`${apiUrl}/settings/get`);
  const data = await response.json();
  return data;
};

export default function SettingsPage() {
  const [data, setData] = useState([]);
  const [ordersEnabled, setOrdersEnabled] = useState(false);
  const [pointSystemIsActive, setPointSystemIsActive] = useState(false);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const { admin } = useAdminStore();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchInfo();
      setPointSystemIsActive(response?.pointSystemIsActive);
      setOrdersEnabled(response?.ordersValid);
      setNewVersionAvailable(response?.newVersion);
      setData(response);
    };

    getData();
  }, []);

  const handlePageRefresh = async () => {
    const response = await fetchInfo();
    setData(response);
  };

  const updateInfo = async (data) => {
    try {
      const response = await fetch(`${apiUrl}/settings/update/1`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactNumberOne: data.contactNumberOne,
          contactNumberTwo: data.contactNumberTwo,
          aboutTm: data.aboutTm,
          aboutRu: data.aboutRu,
          usageTm: data.usageTm,
          usageRu: data.usageRu,
          deliveryInfoTm: data.deliveryInfoTm,
          deliveryInfoRu: data.deliveryInfoRu,
          addressTm: data.addressTm,
          addressRu: data.addressRu,
          instagramOne: data.instagramOne,
          instagramTwo: data.instagramTwo,
          tiktok: data.tiktok,
          imo: data.imo,
          email: data.email,
          expressPrice: data.expressPrice,
          expressInfoTm: data.expressInfoTm,
          expressInfoRu: data.expressInfoRu,
          pointsPercentage: data.pointsPercentage || data?.pointsPercentage,
          pointSystemIsActive: pointSystemIsActive,
          ordersValid: ordersEnabled,
          newVersion: newVersionAvailable,
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Данные обновлены." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил данные настроек`,
          "UPDATE"
        );

        handlePageRefresh();
        router.refresh();
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Информация о нас</h2>
      </div>
      <div className="center-col">
        <div className="flex flex-col w-full max-w-4xl">
          <form
            onSubmit={handleSubmit(updateInfo)}
            className="basic-border shadow shadow-support-200 flex flex-col gap-2 p-2 w-full"
          >
            <div className="flex flex-col">
              <h2>О нас</h2>
              <div className="flex flex-col lg:flex-row justify-between gap-2">
                <Field className="w-full">
                  <Description className="text-dark dark:text-support text-sm font-medium">
                    Данные этого поля будут видны в приложении в вкладке{" "}
                    {`"О нас"`} на русском.
                  </Description>
                  <Textarea
                    {...register("aboutRu")}
                    className={clsx(
                      "bg-white dark:bg-darkTwo basic-border text-dark dark:text-support text-sm block resize-y transition-all mt-2 p-2 min-h-20 w-full",
                      "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                    )}
                    placeholder={data?.aboutRu}
                    defaultValue={data?.aboutRu}
                    rows={4}
                  />
                </Field>
                <Field className="w-full">
                  <Description className="text-dark dark:text-support text-sm font-medium">
                    Данные этого поля будут видны в приложении в вкладке{" "}
                    {`"О нас"`} на туркменском.
                  </Description>
                  <Textarea
                    {...register("aboutTm")}
                    className={clsx(
                      "bg-white dark:bg-darkTwo basic-border text-dark dark:text-support text-sm block resize-y transition-all mt-2 p-2 min-h-20 w-full",
                      "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                    )}
                    placeholder={data?.aboutTm}
                    defaultValue={data?.aboutTm}
                    rows={4}
                  />
                </Field>
              </div>
            </div>
            <div className="flex flex-col">
              <h2>Правила пользования</h2>
              <div className="flex flex-col lg:flex-row justify-between gap-2">
                <Field className="w-full">
                  <Description className="text-dark dark:text-support text-sm font-medium">
                    Данные этого поля будут видны в приложении в вкладке{" "}
                    {`"Правила пользования"`} на русском.
                  </Description>
                  <Textarea
                    {...register("usageRu")}
                    className={clsx(
                      "bg-white dark:bg-darkTwo basic-border text-dark dark:text-support text-sm block resize-y transition-all mt-2 p-2 min-h-20 w-full",
                      "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                    )}
                    placeholder={data?.usageRu}
                    defaultValue={data?.usageRu}
                    rows={4}
                  />
                </Field>
                <Field className="w-full">
                  <Description className="text-dark dark:text-support text-sm font-medium">
                    Данные этого поля будут видны в приложении в вкладке{" "}
                    {`"Правила пользования"`} на туркменском.
                  </Description>
                  <Textarea
                    {...register("usageTm")}
                    className={clsx(
                      "bg-white dark:bg-darkTwo basic-border text-dark dark:text-support text-sm block resize-y transition-all mt-2 p-2 min-h-20 w-full",
                      "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                    )}
                    placeholder={data?.usageTm}
                    defaultValue={data?.usageTm}
                    rows={4}
                  />
                </Field>
              </div>
            </div>
            <div className="flex flex-col">
              <h2>Доставка и оплата</h2>
              <div className="flex flex-col lg:flex-row justify-between gap-2">
                <Field className="w-full">
                  <Description className="text-dark dark:text-support text-sm font-medium">
                    Данные этого поля будут видны в приложении в вкладке{" "}
                    {`"Доставка и оплата"`} на русском.
                  </Description>
                  <Textarea
                    {...register("deliveryInfoRu")}
                    className={clsx(
                      "bg-white dark:bg-darkTwo basic-border text-dark dark:text-support text-sm block resize-y transition-all mt-2 p-2 min-h-20 w-full",
                      "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                    )}
                    placeholder={data?.deliveryInfoRu}
                    defaultValue={data?.deliveryInfoRu}
                    rows={4}
                  />
                </Field>
                <Field className="w-full">
                  <Description className="text-dark dark:text-support text-sm font-medium">
                    Данные этого поля будут видны в приложении в вкладке{" "}
                    {`"Доставка и оплата"`} на туркменском.
                  </Description>
                  <Textarea
                    {...register("deliveryInfoTm")}
                    className={clsx(
                      "bg-white dark:bg-darkTwo basic-border text-dark dark:text-support text-sm block resize-y transition-all mt-2 p-2 min-h-20 w-full",
                      "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                    )}
                    placeholder={data?.deliveryInfoTm}
                    defaultValue={data?.deliveryInfoTm}
                    rows={4}
                  />
                </Field>
              </div>
            </div>
            <div className="flex flex-col">
              <h2>Адрес</h2>
              <div className="flex flex-col lg:flex-row justify-between gap-2">
                <Field className="w-full">
                  <Description className="text-dark dark:text-support text-sm font-medium">
                    Данные этого поля будут видны в приложении в вкладке{" "}
                    {`"Адрес"`} на русском.
                  </Description>
                  <Textarea
                    {...register("addressRu")}
                    className={clsx(
                      "bg-white dark:bg-darkTwo basic-border text-dark dark:text-support text-sm block resize-y transition-all mt-2 p-2 min-h-20 w-full",
                      "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                    )}
                    placeholder={data?.addressRu}
                    defaultValue={data?.addressRu}
                    rows={4}
                  />
                </Field>
                <Field className="w-full">
                  <Description className="text-dark dark:text-support text-sm font-medium">
                    Данные этого поля будут видны в приложении в вкладке{" "}
                    {`"Адрес"`} на туркменском.
                  </Description>
                  <Textarea
                    {...register("addressTm")}
                    className={clsx(
                      "bg-white dark:bg-darkTwo basic-border text-dark dark:text-support text-sm block resize-y transition-all mt-2 p-2 min-h-20 w-full",
                      "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                    )}
                    placeholder={data?.addressTm}
                    defaultValue={data?.addressTm}
                    rows={4}
                  />
                </Field>
              </div>
            </div>
            <div className="flex flex-col">
              <h2>Информация об экпресс заказе</h2>
              <div className="flex flex-col lg:flex-row justify-between gap-2">
                <Field className="w-full">
                  <Description className="text-dark dark:text-support text-sm font-medium">
                    Данные об экспресс заказе на русском.
                  </Description>
                  <Textarea
                    {...register("expressInfoRu")}
                    className={clsx(
                      "bg-white dark:bg-darkTwo basic-border text-dark dark:text-support text-sm block resize-y transition-all mt-2 p-2 min-h-20 w-full",
                      "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                    )}
                    placeholder={data?.expressInfoRu}
                    defaultValue={data?.expressInfoRu}
                    rows={4}
                  />
                </Field>
                <Field className="w-full">
                  <Description className="text-dark dark:text-support text-sm font-medium">
                    Данные об экспресс заказе на туркменском.
                  </Description>
                  <Textarea
                    {...register("expressInfoTm")}
                    className={clsx(
                      "bg-white dark:bg-darkTwo basic-border text-dark dark:text-support text-sm block resize-y transition-all mt-2 p-2 min-h-20 w-full",
                      "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                    )}
                    placeholder={data?.expressInfoTm}
                    defaultValue={data?.expressInfoTm}
                    rows={4}
                  />
                </Field>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="center-row gap-4 h-8 md:h-10 w-full">
                <p className="w-52">Цена экспресса:</p>
                <input
                  type="text"
                  className="input-primary dark:text-support pl-2"
                  defaultValue={data?.expressPrice}
                  placeholder="Цена экспресса"
                  {...register("expressPrice")}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-2">
              <div className="center-row gap-2 w-full">
                <p className="w-32">Номер телефона 1:</p>
                <input
                  type="text"
                  className="input-primary dark:text-support pl-2"
                  defaultValue={data?.contactNumberOne}
                  placeholder="Номер для контакта 1"
                  {...register("contactNumberOne")}
                />
              </div>
              <div className="center-row gap-2 w-full">
                <p className="w-32">Номер телефона 2:</p>
                <input
                  type="text"
                  className="input-primary dark:text-support pl-2"
                  defaultValue={data?.contactNumberTwo}
                  placeholder="Номер для контакта 2"
                  {...register("contactNumberTwo")}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-2">
              <div className="center-row gap-2 w-full">
                <p className="w-32">Instagram:</p>
                <input
                  type="text"
                  className="input-primary dark:text-support pl-2"
                  defaultValue={data?.instagramOne}
                  placeholder="Instagram"
                  {...register("instagramOne")}
                />
              </div>
              <div className="center-row gap-2 w-full">
                <p className="w-32">E-Mail:</p>
                <input
                  type="text"
                  className="input-primary dark:text-support pl-2"
                  defaultValue={data?.email}
                  placeholder="E-Mail"
                  {...register("email")}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="center-row gap-4 h-8 md:h-10 w-full">
                <p className="w-52">Балловая система активна:</p>
                <Switch
                  checked={pointSystemIsActive}
                  onChange={() => {
                    setPointSystemIsActive(!pointSystemIsActive);
                  }}
                  className="group relative flex cursor-pointer rounded-full bg-support dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                  />
                </Switch>
              </div>
              <div className="center-row gap-2 w-full">
                <p className="w-32">Процент балллов %:</p>
                <input
                  type="text"
                  className="input-primary dark:text-support pl-2"
                  defaultValue={data?.pointsPercentage}
                  placeholder="Процент балллов"
                  {...register("pointsPercentage")}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="center-row gap-4 h-8 md:h-10 w-full">
                <p className="w-52">Заказы принимаются:</p>
                <Switch
                  checked={ordersEnabled}
                  onChange={() => {
                    setOrdersEnabled(!ordersEnabled);
                  }}
                  className="group relative flex cursor-pointer rounded-full bg-support dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                  />
                </Switch>
              </div>
              <div className="center-row gap-4 h-8 md:h-10 w-full">
                <p className="w-52">Вышло обновление:</p>
                <Switch
                  checked={newVersionAvailable}
                  onChange={() => {
                    setNewVersionAvailable(!newVersionAvailable);
                  }}
                  className="group relative flex cursor-pointer rounded-full bg-support dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                  />
                </Switch>
              </div>
            </div>
            <button className="btn-primary center-row justify-center gap-2 mt-2">
              <Save className="size-5" />
              <span>Сохранить</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
