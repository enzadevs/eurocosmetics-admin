"use client";

import clsx from "clsx";
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
  Textarea,
  Switch,
} from "@headlessui/react";
import { ChevronDown, Send } from "lucide-react";

const fetchMessages = async () => {
  const response = await fetch(`${apiUrl}/marketing/messages/`);
  const data = await response.json();
  return data;
};

const fetchPhoneNumbers = async (filters) => {
  const response = await fetch(`${apiUrl}/marketing/phones`);
  const data = await response.json();
  return data;
};

const validateField = (field, errorMessage) => {
  if (
    (typeof field === "string" && field.trim() === "") ||
    (typeof field !== "string" && !field)
  ) {
    ErrorToast({ errorText: errorMessage });
    return false;
  }
  return true;
};

export default function MarketingPage() {
  const { register, handleSubmit, reset } = useForm();
  const [devices, setDevices] = useState();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const { admin } = useAdminStore();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchMessages();
      const phoneNumbersResponse = await fetchPhoneNumbers();
      setData(response?.messages);
      setDevices(phoneNumbersResponse?.total);
    };

    getData();
  }, []);

  const handleNewFetchRequest = async () => {
    const response = await fetchMessages();
    setData(response?.messages);
  };

  const createNewSms = async (data) => {
    const validations = [
      { field: data.title, error: "Наполните поле `Заголовок`." },
      { field: data.content, error: "Наполните поле `Содержание`." },
    ];

    for (let validation of validations) {
      if (!validateField(validation.field, validation.error)) {
        return;
      }
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/marketing/new/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          isActive: isActive || false,
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "СМС рассылка отправлена." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Отправил СМС рассылку : ${data.title}`,
          "CREATE"
        );

        handleNewFetchRequest();
        reset();
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto xs:ml-0">СМС рассылка</h2>
        <div className="bg-primary rounded-lg center-row gap-2 ml-2 lg:ml-auto h-9 lg:h-10 px-2">
          <p className="text-white">Кол. номеров:</p>
          <p className="text-white font-bold">{devices}</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <div className="custom-scrollbar basic-border flex flex-col px-2 pb-2 h-[768px] w-full lg:w-1/2">
          <div className="flex flex-col items-center justify-between gap-2">
            <div className="border-b border-support-200 center-row justify-between gap-2 h-9 w-full">
              <p className="font-bold w-[40%]">Заголовок</p>
              <p className="font-bold w-[40%]">Содержание</p>
              <p className="font-bold w-[20%]">Отправлено</p>
            </div>
            {data?.map((item) => {
              return (
                <div
                  className="border-b border-support-200 center-row justify-between gap-2 py-2 min-h-9 w-full"
                  key={item.id}
                >
                  <p className="text-primary block break-all px-2 h-auto w-[40%]">
                    {item.title}
                  </p>
                  <p className="bg-support-50 rounded-md block break-all px-2 h-auto whitespace-pre-line w-[40%]">
                    {item.content}
                  </p>
                  <p className="font-medium w-[20%]">{item.createdAt}</p>
                </div>
              );
            })}
          </div>
        </div>
        <Disclosure
          as="div"
          className="basic-border flex flex-col gap-2 px-2 h-fit w-full lg:w-1/2"
          defaultOpen={true}
        >
          <DisclosureButton className="group flex items-center justify-between h-9 w-full">
            <p className="font-bold">Отправить СМС рассылку</p>
            <ChevronDown className="dark:text-support size-5 group-data-[open]:rotate-180" />
          </DisclosureButton>
          <DisclosurePanel>
            <form
              onSubmit={handleSubmit(createNewSms)}
              className="flex flex-col gap-2 w-full"
            >
              <input
                type="text"
                className="input-primary dark:text-support px-2 w-full"
                defaultValue=""
                placeholder="Заголовок"
                {...register("title")}
              />
              <Textarea
                className={clsx(
                  "bg-white basic-border-2 rounded-lg text-dark block resize-y transition-all mt-2 p-2 min-h-20 w-full",
                  "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                )}
                placeholder="Содержание"
                defaultValue=""
                rows={4}
                {...register("content")}
              />
              <div className="bg-white dark:bg-dark basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
                <p className=" w-52">Начать рассылку:</p>
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
              <p>
                Для добавления стикеров нажмите{" "}
                <span className="text-primary font-bold">"Windows + ."</span>
              </p>
              <button
                disabled={isLoading}
                className="btn-primary center-row justify-center gap-2 disabled:animate-pulse disabled:cursor-not-allowed px-2 mb-2 w-full"
              >
                <Send className="size-5" />
                <span className="font-semibold text-sm md:text-base">
                  {isLoading ? "Отправка" : "Отправить"}
                </span>
              </button>
            </form>
          </DisclosurePanel>
        </Disclosure>
      </div>
    </div>
  );
}
