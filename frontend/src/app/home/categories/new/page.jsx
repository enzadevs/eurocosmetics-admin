"use client";

import BackForthButtons from "@/components/nav/BackForthButtons";
import Image from "next/image";
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

export default function NewAdPage() {
  const [selectedImage, setSelectedImage] = useState();
  const [isActive, setIsActive] = useState(true);
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const { admin } = useAdminStore();

  const createNewCategory = async (data) => {
    if (!data.nameTm) {
      ErrorToast({
        errorText: "Дайте название категории на туркменском языке.",
      });
      return;
    }

    if (!data.nameRu) {
      ErrorToast({
        errorText: "Дайте название категории на русском языке.",
      });
      return;
    }

    if (!selectedImage) {
      ErrorToast({ errorText: "Пожалуйста, загрузите изображение." });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nameTm", data.nameTm);
      formData.append("nameRu", data.nameRu);
      formData.append("order", data.order);
      formData.append("deliveryPrice", 0);
      formData.append("isActive", isActive);
      formData.append("image", selectedImage);

      const response = await fetch(`${apiUrl}/categories/new`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        SuccessToast({ successText: "Категория добавлена." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Создал новую категорию : ${data.nameRu}`,
          "CREATE"
        );

        setTimeout(() => {
          NProgress.start();
          router.push("/home/categories");
        }, 1000);
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
        <h2 className="ml-auto md:ml-0">Новая категория</h2>
      </div>
      <div className="center-col">
        <div className="w-full max-w-2xl">
          <form
            onSubmit={handleSubmit(createNewCategory)}
            className="form-holder"
          >
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">
                <span className="text-red-500">* </span>Имя (ткм):
              </p>
              <input
                type="text"
                className="input-primary dark:text-support px-2 w-full"
                defaultValue=""
                placeholder="Имя категории (ткм.)"
                {...register("nameTm")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">
                <span className="text-red-500">* </span>Имя (ру):
              </p>
              <input
                type="text"
                className="input-primary dark:text-support px-2 w-full"
                defaultValue=""
                placeholder="Имя категории (ру.)"
                {...register("nameRu")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Номер:</p>
              <input
                type="number"
                className="input-primary dark:text-support px-2 w-full"
                defaultValue=""
                placeholder="Номер"
                {...register("order")}
              />
            </div>
            <div className="flex flex-col md:flex-row md:justify-between gap-2 w-full">
              <div className="bg-support dark:bg-darkTwo basic-border flex flex-col items-center justify-between gap-2 p-2 w-full md:w-[60%]">
                <p className="text-center">Размер изображения 250 x 250</p>
                {selectedImage ? (
                  <div className="center-col relative block h-52 w-52">
                    {selectedImage && selectedImage instanceof File && (
                      <Image
                        src={URL.createObjectURL(selectedImage)}
                        alt="image"
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
                        fill
                      />
                    )}
                  </div>
                ) : (
                  <div className="center-col h-52 w-52">
                    <ImagePlus className="text-dark dark:text-support size-12" />
                  </div>
                )}
                <input
                  type="file"
                  name="image"
                  onChange={getFile}
                  multiple
                  accept="image/*"
                  placeholder="Добавить фото"
                  className="custom-file-input"
                ></input>
              </div>
              <div className="flex flex-col gap-1 w-full md:w-[40%]">
                <div className="bg-white dark:bg-dark basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
                  <p className="w-40">Категория доступна:</p>
                  <Switch
                    checked={isActive}
                    onChange={() => {
                      setIsActive(!isActive);
                    }}
                    className="group relative flex cursor-pointer rounded-full bg-support dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
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
                <div className="border-0 md:border-t border-support-200 pt-2 mt-auto">
                  <p>
                    Рекомендуем выложить изображения не больше 1ого мегабайта.
                  </p>
                  <p className="text-red-500">*(обязательные поля)</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
