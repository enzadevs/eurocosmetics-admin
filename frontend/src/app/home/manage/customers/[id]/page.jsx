"use client";

import BackForthButtons from "@/components/nav/BackForthButtons";
import * as NProgress from "nprogress";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Switch } from "@headlessui/react";
import { Save, Trash2 } from "lucide-react";

const fertchData = async (id) => {
  const response = await fetch(`${apiUrl}/customer/fetch/${id}`);
  const data = await response.json();
  return data;
};

export default function UpdateClientPage({ params }) {
  const [customerData, setCustomerData] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const { admin } = useAdminStore();

  useEffect(() => {
    const getData = async () => {
      const response = await fertchData(params.id);
      setCustomerData(response);
      setIsBlocked(response?.isBlocked);
    };

    getData();
  }, [params.id]);

  const updateData = async (data) => {
    try {
      const response = await fetch(`${apiUrl}/customer/update/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          username: data.username || customerData?.username,
          phoneNumber: data.phoneNumber || customerData?.phoneNumber,
          pointsEarned: data.pointsEarned,
          password: data.password || customerData?.password,
          isBlocked: isBlocked,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        SuccessToast({ successText: "Данные клиента обновлены." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил клиента с номером : ${customerData?.phoneNumber}`,
          "UPDATE"
        );

        setTimeout(() => {
          NProgress.start();
          router.push("/home/manage/customers");
        }, 1000);
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${apiUrl}/customer/delete/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        SuccessToast({ successText: "Клиент удален." });
        setTimeout(() => {
          NProgress.start();
          router.push("/home/manage/customers");
        }, 1000);
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const confirmDelete = (event) => {
    event.preventDefault();
    if (window.confirm(`Вы уверены, что хотите удалить аккаунт клиента?`)) {
      handleDelete();
    }
  };

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Обновить данные клиента</h2>
      </div>
      <div className="center-col">
        <div className="w-full max-w-2xl">
          <form onSubmit={handleSubmit(updateData)} className="form-holder">
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-36">Имя :</p>
              <input
                type="text"
                className="input-primary dark:text-support px-2"
                defaultValue={customerData?.username}
                placeholder="Имя"
                {...register("username")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-36">Номер телефона:</p>
              <input
                type="text"
                className="input-primary dark:text-support px-2 w-full"
                defaultValue={customerData?.phoneNumber}
                placeholder="Номер телефона"
                {...register("phoneNumber")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-36">Баллы :</p>
              <input
                type="text"
                className="input-primary dark:text-support px-2 w-full"
                defaultValue={customerData?.pointsEarned}
                placeholder="Баллы"
                {...register("pointsEarned")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-36">Изменить пароль :</p>
              <input
                type="text"
                className="input-primary dark:text-support px-2 w-full"
                defaultValue=""
                placeholder="Введите новый пароль"
                {...register("password")}
              />
            </div>
            <div className="bg-white dark:bg-dark basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
              <p className="w-50">Клиент заблокирован :</p>
              <Switch
                checked={isBlocked}
                onChange={() => {
                  setIsBlocked(!isBlocked);
                }}
                className="group relative flex cursor-pointer rounded-full bg-support dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                />
              </Switch>
            </div>
            <div className="center-row gap-2">
              <button className="btn-primary center-row justify-center gap-2 px-2 w-full">
                <Save className="size-5" />
                <span className="font-semibold">Сохранить</span>
              </button>
              <button
                onClick={(event) => confirmDelete(event)}
                className="btn-primary center-row justify-center gap-2 px-2 w-full"
              >
                <Trash2 className="size-5" />
                <span className="font-semibold text-sm md:text-base">
                  Удалить
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
