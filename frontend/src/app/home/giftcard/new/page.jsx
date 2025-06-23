"use client";

import Image from "next/image";
import BackForthButtons from "@/components/nav/BackForthButtons";
import * as NProgress from "nprogress";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Switch } from "@headlessui/react";
import { PlusIcon, ImagePlus } from "lucide-react";

export default function NewGiftCardPage() {
  const [selectedImage, setSelectedImage] = useState();
  const [isActive, setIsActive] = useState(true);
  const { register, handleSubmit } = useForm();

  const router = useRouter();
  const { admin } = useAdminStore();

  const createBannerRequest = async (data) => {
    if (!selectedImage) {
      ErrorToast({ errorText: "Пожалуйста, загрузите изображение." });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("headerTm", data.headerTm);
      formData.append("headerRu", data.headerRu);
      formData.append("order", data.order);
      formData.append("link", data.link);
      formData.append("isActive", isActive);
      formData.append("image", selectedImage);
      formData.append("startDate", data.startDate);
      formData.append("endDate", data.endDate);
      formData.append("productsArray", null);

      const response = await fetch(`${apiUrl}/giftcard/new`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        SuccessToast({ successText: "Добавлена гифт карта." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Создал новый гифт карта : ${data.name}`,
          "CREATE"
        );

        NProgress.start();
        router.push("/home/giftcard");
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  function getFile(e) {
    const file = e.target.files[0];
    setSelectedImage(file || null);
  }

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Новая гифт карта</h2>
      </div>
      <div className="center-col w-full">
        <div className="dark:bg-darkTwo w-full max-w-3xl">
          <form
            onSubmit={handleSubmit(createBannerRequest)}
            className="form-holder mb-2"
          >
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Номер:</p>
              <input
                type="number"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Номер"
                {...register("order")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Оглавление (тм):</p>
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Оглавление (ткм)"
                {...register("headerTm")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Оглавление (ру):</p>
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Оглавление (ру)"
                {...register("headerRu")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Сумма:</p>
              <input
                type="number"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Сумма"
                {...register("link")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">
                <span className="text-red-500 font-bold">* </span>
                Дата начала:
              </p>
              <input
                type="date"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Дата начала"
                {...register("startDate")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">
                <span className="text-red-500 font-bold">* </span>Дата
                окончания:
              </p>
              <input
                type="date"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Дата окончания"
                {...register("endDate")}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-1 w-full">
              <div className="bg-support basic-border flex flex-col items-center justify-between gap-2 p-2 w-full md:w-1/2">
                <p className="text-center">Размер изображения 2000 x 1000</p>
                {selectedImage ? (
                  <div className="rounded relative block h-[100px] md:h-[200px] w-[175px] md:w-[350px]">
                    {selectedImage && selectedImage instanceof File && (
                      <Image
                        src={URL.createObjectURL(selectedImage)}
                        alt="image"
                        className="rounded object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
                        fill
                      />
                    )}
                  </div>
                ) : (
                  <div className="rounded center-col relative h-52 max-h-52 w-full">
                    <ImagePlus className="text-dark dark:text-support size-10" />
                  </div>
                )}
                <input
                  type="file"
                  name="posterImage"
                  onChange={getFile}
                  accept="image/*"
                  placeholder="Добавить фото"
                  className="custom-file-input"
                />
              </div>
              <div className="flex flex-col mb-2 gap-2 w-full md:w-1/2">
                <div className="bg-white dark:bg-dark basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
                  <p className="w-32">Карта активна:</p>
                  <Switch
                    checked={isActive}
                    onChange={() => {
                      setIsActive(!isActive);
                    }}
                    className="group relative flex cursor-pointer rounded-full bg-support-100 dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                    />
                  </Switch>
                </div>
                <button className="btn-primary center-row justify-center gap-2 px-4 w-full">
                  <PlusIcon className="size-5" />
                  <span className="font-semibold text-sm md:text-base">
                    Добавить
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
